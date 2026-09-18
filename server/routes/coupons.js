const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");




router.post("/validate", async (req, res) => {

    const { code, cartToken } = req.body;


    if (!code || !code.trim()) {

        return res.status(400).json({
            success: false,
            message: "Please enter a coupon code."
        });

    }
    if (!cartToken) {

    return res.status(400).json({
        success: false,
        message: "Cart token is required."
    });

}
const { data: cart, error: cartError } =
    await supabase
        .from("carts")
        .select(`
            id,
            cart_token,
            status
        `)
        .eq("cart_token", cartToken)
        .eq("status", "active")
        .maybeSingle();


if (cartError) {

    return res.status(500).json({
        success: false,
        message: "Unable to load cart."
    });

}
if (!cart) {

    return res.status(404).json({
        success: false,
        message: "Active cart not found."
    });

}
const { data: cartItems, error: itemsError } =
    await supabase
        .from("cart_items")
        .select(`
            id,
            quantity,
            product_variants (
                id,
                price
            )
        `)
        .eq("cart_id", cart.id);


if (itemsError) {

    return res.status(500).json({
        success: false,
        message: "Unable to load cart items."
    });

}
if (!cartItems || cartItems.length === 0) {

    return res.status(400).json({
        success: false,
        message: "Your cart is empty."
    });

}
let subtotal = 0;

cartItems.forEach((item) => {

    const price =
        Number(
            item.product_variants.price
        );

    subtotal +=
        price * item.quantity;

});

    const normalizedCode =
        code.trim().toUpperCase();


    const { data: coupon, error } =
        await supabase
            .from("coupons")
            .select("*")
            .eq("code", normalizedCode)
            .maybeSingle();


    if (error) {

        return res.status(500).json({
            success: false,
            message: "Unable to validate coupon."
        });

    }
    if (!coupon) {

    return res.status(404).json({
        success: false,
        message: "Coupon code not found."
    });

}
if (!coupon.active) {

    return res.status(400).json({
        success: false,
        message: "This coupon is no longer active."
    });

}
let discountAmount = 0;

if (coupon.discount_type === "percentage") {

    discountAmount =
        Math.round(
            subtotal *
            (Number(coupon.discount_value) / 100) *
            100
        ) / 100;

}
const discountedSubtotal =
    Math.max(
        0,
        Math.round(
            (subtotal - discountAmount) * 100
        ) / 100
    );
    const shipping =
    subtotal >= 45
        ? 0
        : 6.95;
        const total =
    Math.round(
        (discountedSubtotal + shipping) * 100
    ) / 100;

    const {
    data: updatedCart,
    error: updateCartError
} =
    await supabase
        .from("carts")
        .update({
            coupon_id: coupon.id,
            updated_at: new Date().toISOString()
        })
        .eq("id", cart.id)
        .select("id, cart_token, coupon_id")
        .maybeSingle();

console.log(
    "Updated coupon cart:",
    updatedCart
);
if (updateCartError) {
    console.error(
        "Coupon cart update error:",
        updateCartError.message
    );

    return res.status(500).json({
        success: false,
        message: "Unable to apply coupon."
    });
}
return res.json({
    success: true,
    coupon: {
        code: coupon.code,
        discountType:
            coupon.discount_type,
        discountValue:
            Number(coupon.discount_value)
    },
    subtotal,
discountAmount,
discountedSubtotal,
shipping,
total
});
});

router.post("/remove", async (req, res) => {

    try {

        const { cartToken } = req.body;

        if (!cartToken) {
            return res.status(400).json({
                success: false,
                message: "Cart token is required."
            });
        }

        const {
            data: cart,
            error: cartError
        } = await supabase
            .from("carts")
            .select("id, coupon_id")
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

        const {
            data: updatedCart,
            error: updateError
        } = await supabase
            .from("carts")
            .update({
                coupon_id: null,
                updated_at: new Date().toISOString()
            })
            .eq("id", cart.id)
            .select("id, coupon_id")
            .maybeSingle();

        if (updateError) {
            throw updateError;
        }

        return res.json({
            success: true,
            message: "Coupon removed.",
            cart: updatedCart
        });

    } catch (error) {

        console.error(
            "Remove coupon error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to remove coupon."
        });

    }

});

module.exports = router;