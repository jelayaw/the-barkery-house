const express = require("express");
const stripe = require("../services/stripe");
const supabase = require("../services/supabase");
const sendOrderConfirmation =
    require(
        "../services/send-order-confirmation"
    );

const router = express.Router();


router.post("/", async (req, res) => {

    const signature =
        req.headers["stripe-signature"];

    const webhookSecret =
        process.env.STRIPE_WEBHOOK_SECRET;


    if (!webhookSecret) {

        console.error(
            "Missing Stripe webhook secret."
        );

        return res.status(500).json({
            received: false
        });

    }


    let event;


    try {

        event =
            stripe.webhooks.constructEvent(
                req.body,
                signature,
                webhookSecret
            );

    } catch (error) {

        console.error(
            "Webhook signature verification failed:",
            error.message
        );

        return res.status(400).send(
            `Webhook Error: ${error.message}`
        );

    }


    console.log(
        "Verified Stripe event:",
        event.type
    );


    if (
        event.type ===
        "checkout.session.completed"
    ) {

        const session =
            event.data.object;


        const cartToken =
            session.metadata
                ? session.metadata.cart_token
                : null;


        const orderId =
            session.metadata
                ? session.metadata.order_id
                : null;


        console.log(
            "Completed checkout session:",
            {
                id:
                    session.id,

                paymentStatus:
                    session.payment_status,

                amountTotal:
                    session.amount_total,

                customerEmail:
                    session.customer_details
                        ? session.customer_details.email
                        : session.customer_email,

                cartToken:
                    cartToken,

                orderId:
                    orderId
            }
        );


        if (
            !cartToken ||
            !orderId
        ) {

            console.log(
                "Stripe session is not linked to a Barkery House order:",
                session.id
            );

            return res.json({
                received: true,
                ignored: true
            });

        }


        if (
            session.payment_status !== "paid"
        ) {

            console.log(
                "Stripe session is not paid:",
                session.id
            );

            return res.json({
                received: true,
                ignored: true
            });

        }


        const {
            data: cart,
            error: cartError
        } =
            await supabase
                .from("carts")
                .select(
                    "id, cart_token, status"
                )
                .eq(
                    "cart_token",
                    cartToken
                )
                .maybeSingle();


        if (cartError) {

            console.error(
                "Webhook cart lookup failed:",
                cartError.message
            );

            return res.status(500).json({
                received: false
            });

        }


        if (!cart) {

            console.error(
                "No cart found for Stripe session:",
                session.id
            );

            return res.status(404).json({
                received: false
            });

        }


        console.log(
            "Paid cart found:",
            {
                id:
                    cart.id,

                cartToken:
                    cart.cart_token,

                status:
                    cart.status
            }
        );


        const {
            data: order,
            error: orderLookupError
        } =
          await supabase
    .from("orders")
    .select(
        "id, status, stripe_session_id, customer_email, customer_name, subtotal, discount_amount, shipping_amount, total, coupon_code"
    )
    .eq(
        "id",
        orderId
    )
    .maybeSingle();


if (orderLookupError) {

    console.error(
        "Webhook order lookup failed:",
        orderLookupError.message
    );

    return res.status(500).json({
        received: false
    });

}


if (!order) {

    console.error(
        "No order found for Stripe session:",
        session.id
    );

    return res.status(404).json({
        received: false
    });

}


const {
    data: orderItems,
    error: orderItemsError
} =
    await supabase
        .from("order_items")
        .select(
            "product_name, variant_name, unit_price, quantity, line_total"
        )
        .eq(
            "order_id",
            order.id
        );


if (orderItemsError) {

    console.error(
        "Webhook order items lookup failed:",
        orderItemsError.message
    );

    return res.status(500).json({
        received: false
    });

}

        if (!order) {

            console.error(
                "No order found for Stripe session:",
                session.id
            );

            return res.status(404).json({
                received: false
            });

        }


        if (
            order.stripe_session_id !==
            session.id
        ) {

            console.error(
                "Stripe session does not match order:",
                {
                    orderId:
                        order.id,

                    storedSessionId:
                        order.stripe_session_id,

                    receivedSessionId:
                        session.id
                }
            );

            return res.status(400).json({
                received: false
            });

        }


        if (
            order.status === "paid" &&
            cart.status === "converted"
        ) {

            console.log(
                "Webhook already processed:",
                {
                    orderId:
                        order.id,

                    cartId:
                        cart.id
                }
            );

            return res.json({
                received: true,
                alreadyProcessed: true
            });

        }


        const paymentIntentId =
            typeof session.payment_intent ===
            "string"
                ? session.payment_intent
                : session.payment_intent
                    ? session.payment_intent.id
                    : null;


        const {
            error: orderUpdateError
        } =
            await supabase
                .from("orders")
                .update({
                    status:
                        "paid",

                    stripe_payment_id:
                        paymentIntentId
                })
                .eq(
                    "id",
                    order.id
                );


        if (orderUpdateError) {

            console.error(
                "Failed to mark order paid:",
                orderUpdateError.message
            );

            return res.status(500).json({
                received: false
            });

        }


        console.log(
            "Order marked paid:",
            {
                orderId:
                    order.id,

                stripePaymentId:
                    paymentIntentId
            }
        );


        const {
            error: cartUpdateError
        } =
            await supabase
                .from("carts")
                .update({
                    status:
                        "converted"
                })
                .eq(
                    "id",
                    cart.id
                );


        if (cartUpdateError) {

            console.error(
                "Failed to convert cart:",
                cartUpdateError.message
            );

            return res.status(500).json({
                received: false
            });

        }


        console.log(
            "Cart converted:",
            {
                cartId:
                    cart.id,

                status:
                    "converted"
            }
        );

        try {

 const emailResult =
    await sendOrderConfirmation({
        to: order.customer_email,
        orderId: order.id,
        customerName:
            order.customer_name,
        subtotal:
            order.subtotal,
        discountAmount:
            order.discount_amount,
        shippingAmount:
            order.shipping_amount,
        total:
            order.total,
        couponCode:
            order.coupon_code,
        items:
            orderItems
    });

    console.log(
        "Order confirmation email sent:",
        {
            orderId:
                order.id,

            emailId:
                emailResult
                    ? emailResult.id
                    : null
        }
    );

} catch (emailError) {

    console.error(
        "Order confirmation email failed:",
        emailError.message
    );

}

    }


    if (
        event.type ===
        "checkout.session.expired"
    ) {

        const session =
            event.data.object;


        const orderId =
            session.metadata
                ? session.metadata.order_id
                : null;


        if (!orderId) {

            console.log(
                "Expired Stripe session has no Barkery House order:",
                session.id
            );

            return res.json({
                received: true,
                ignored: true
            });

        }


        const {
            data: abandonedOrder,
            error: abandonedOrderError
        } =
            await supabase
                .from("orders")
                .update({
                    status: "abandoned"
                })
                .eq(
                    "id",
                    orderId
                )
                .eq(
                    "stripe_session_id",
                    session.id
                )
                .eq(
                    "status",
                    "pending"
                )
                .select(
                    "id, status"
                )
                .maybeSingle();


        if (abandonedOrderError) {

            console.error(
                "Failed to mark expired order abandoned:",
                abandonedOrderError.message
            );

            return res.status(500).json({
                received: false
            });

        }


        if (abandonedOrder) {

            console.log(
                "Order marked abandoned:",
                {
                    orderId:
                        abandonedOrder.id,

                    status:
                        abandonedOrder.status
                }
            );

        } else {

            console.log(
                "Expired session did not match a pending order:",
                session.id
            );

        }

    }


    return res.json({
        received: true
    });

});


module.exports = router;