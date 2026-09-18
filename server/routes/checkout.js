const express = require("express");
const supabase = require("../services/supabase");
const stripe = require("../services/stripe");

const router = express.Router();


router.post("/", async (req, res) => {

    try {

        const {
    cartToken,
    customer
} = req.body;


if (!cartToken) {

    return res.status(400).json({
        success: false,
        message: "Cart token is required."
    });

}

if (
    !customer ||
    !customer.email ||
    !customer.firstName ||
    !customer.lastName ||
    !customer.addressLine1 ||
    !customer.city ||
    !customer.state ||
    !customer.postalCode ||
    !customer.phone
) {

    return res.status(400).json({
        success: false,
        message:
            "Complete customer and shipping information is required."
    });

}


const {
    data: cart,
    error: cartError
} = await supabase
    .from("carts")
    .select(`
        id,
        cart_token,
        coupon_id,
        status,
        cart_items (
            id,
            quantity,
            product_id,
            variant_id,
            products (
                id,
                name,
                active
            ),
            product_variants (
                id,
                product_id,
                size,
                price,
                active
            )
        )
    `)
    .eq("cart_token", cartToken)
    .eq("status", "active")
    .maybeSingle();


if (cartError) {
    throw cartError;
}


if (!cart) {

    return res.status(404).json({
        success: false,
        message: "Active cart not found."
    });

}


const items =
    cart.cart_items || [];


if (items.length === 0) {

    return res.status(400).json({
        success: false,
        message: "Your cart is empty."
    });

}


let subtotal = 0;


for (const item of items) {

    const product =
        item.products;

    const variant =
        item.product_variants;


    if (
        !product ||
        !variant ||
        !product.active ||
        !variant.active ||
        variant.product_id !== product.id
    ) {

        return res.status(400).json({
            success: false,
            message:
                "One or more cart items are no longer available."
        });

    }


    const price =
        Number(variant.price);

    subtotal +=
        price * item.quantity;

}


subtotal =
    Math.round(subtotal * 100) / 100;


let discountAmount = 0;
let discountedSubtotal = subtotal;
let appliedCoupon = null;


if (cart.coupon_id) {

    const {
        data: coupon,
        error: couponError
    } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", cart.coupon_id)
        .maybeSingle();


    if (couponError) {
        throw couponError;
    }


    if (
        coupon &&
        coupon.active &&
        coupon.discount_type === "percentage"
    ) {

        appliedCoupon = coupon;

        discountAmount =
            subtotal *
            (
                Number(
                    coupon.discount_value
                ) / 100
            );

        discountAmount =
            Math.round(
                discountAmount * 100
            ) / 100;

        discountedSubtotal =
            subtotal - discountAmount;

    }

}


const shipping =
    subtotal >= 45
        ? 0
        : 6.95;


const total =
    discountedSubtotal + shipping;

    const totalInCents =
    Math.round(
        total * 100
    );

    const customerName =
    `${customer.firstName} ${customer.lastName}`;

    const {
    data: existingPendingOrder,
    error: existingPendingOrderError
} =
    await supabase
        .from("orders")
        .select(
            "id, stripe_session_id"
        )
        .eq(
            "cart_id",
            cart.id
        )
        .eq(
            "status",
            "pending"
        )
        .maybeSingle();


if (existingPendingOrderError) {
    throw existingPendingOrderError;
}

console.log(
    "Existing pending order lookup:",
    {
        cartId: cart.id,
        existingPendingOrder
    }
);


if (
    existingPendingOrder &&
    existingPendingOrder.stripe_session_id
) {

    const existingSession =
        await stripe.checkout.sessions.retrieve(
            existingPendingOrder.stripe_session_id
        );


    if (
        existingSession.status === "open" &&
        existingSession.url
    ) {

        console.log(
            "Reusing existing checkout session:",
            {
                orderId:
                    existingPendingOrder.id,

                stripeSessionId:
                    existingPendingOrder.stripe_session_id
            }
        );


        return res.json({
            success: true,

            checkoutUrl:
                existingSession.url,

            sessionId:
                existingSession.id,

            reused:
                true
        });

    }

}


const {
    data: pendingOrder,
    error: orderError
} =
    await supabase
        .from("orders")
        .insert({
    cart_id: cart.id,
    customer_email: customer.email,
    customer_name: customerName,
    status: "pending",
    subtotal: subtotal,
    discount_amount: discountAmount,
    shipping_amount: shipping,
    total: total,
    coupon_code: appliedCoupon ? appliedCoupon.code : null
})
        .select("id")
        .single();


if (orderError) {
    throw orderError;
}


console.log(
    "Pending order created:",
    pendingOrder.id
);

const orderItems =
    items.map((item) => {

        const product =
            item.products;

        const variant =
            item.product_variants;

        const unitPrice =
            Number(variant.price);

        return {
            order_id:
                pendingOrder.id,

            product_id:
                product.id,

            variant_id:
                variant.id,

            product_name:
                product.name,

            variant_name:
                variant.size,

            unit_price:
                unitPrice,

            quantity:
                item.quantity,

            line_total:
                Math.round(
                    unitPrice *
                    item.quantity *
                    100
                ) / 100
        };

    });


const {
    error: orderItemsError
} =
    await supabase
        .from("order_items")
        .insert(orderItems);


if (orderItemsError) {
    throw orderItemsError;
}


console.log(
    "Order items saved:",
    orderItems.length
);

const {
    error: addressError
} =
    await supabase
        .from("order_addresses")
        .insert({
            order_id:
                pendingOrder.id,

            address_type:
                "shipping",

            full_name:
                customerName,

            address_line_1:
                customer.addressLine1,

            address_line_2:
                customer.addressLine2 || null,

            city:
                customer.city,

            state:
                customer.state,

            postal_code:
                customer.postalCode,

            country:
                "US"
        });


if (addressError) {
    throw addressError;
}


console.log(
    "Shipping address saved for order:",
    pendingOrder.id
);

    const checkoutSession =
    await stripe.checkout.sessions.create({

        mode: "payment",

        customer_email:
            customer.email,

        line_items: [
            {
                price_data: {
                    currency: "usd",

                    product_data: {
                        name:
                            "The Barkery House Order"
                    },

                    unit_amount:
                        totalInCents
                },

                quantity: 1
            }
        ],

        success_url:
    `${req.protocol}://${req.get("host")}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
            `${req.protocol}://${req.get("host")}/checkout.html?payment=cancelled`,

        metadata: {
    cart_token:
        cartToken,

    order_id:
        String(
            pendingOrder.id
        )
}

    });

    const {
    error: sessionUpdateError
} =
    await supabase
        .from("orders")
        .update({
            stripe_session_id:
                checkoutSession.id
        })
        .eq(
            "id",
            pendingOrder.id
        );


if (sessionUpdateError) {
    throw sessionUpdateError;
}


console.log(
    "Stripe session linked to order:",
    {
        orderId:
            pendingOrder.id,

        stripeSessionId:
            checkoutSession.id
    }
);

console.log(
    "Backend checkout pricing:",
    {
        subtotal,
        discountAmount,
        discountedSubtotal,
        shipping,
        total,
        totalInCents,
        coupon:
            appliedCoupon
                ? appliedCoupon.code
                : null
    }
);


return res.json({
    success: true,

    checkoutUrl:
    checkoutSession.url,

sessionId:
    checkoutSession.id,
    message:
        "Checkout pricing verified by backend.",

    pricing: {
        subtotal,
        discountAmount,
        discountedSubtotal,
        shipping,
        total,
        freeShipping:
            shipping === 0,

        appliedCoupon:
            appliedCoupon
                ? appliedCoupon.code
                : null
    }
});


    } catch (error) {

        console.error(
            "Checkout route error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Unable to process checkout."
        });

    }

});


module.exports = router;