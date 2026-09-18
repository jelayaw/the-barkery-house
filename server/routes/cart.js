const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const supabase = require("../services/supabase");


/* ========================================
   CREATE OR FIND CART
======================================== */

async function getOrCreateCart(cartToken) {

    if (cartToken) {

        const { data: existingCart, error } =
            await supabase
                .from("carts")
                .select("*")
                .eq("cart_token", cartToken)
                .eq("status", "active")
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (existingCart) {
            return existingCart;
        }

    }


    const newCartToken =
        crypto.randomUUID();


    const { data: newCart, error } =
        await supabase
            .from("carts")
            .insert({
                cart_token: newCartToken,
                status: "active"
            })
            .select()
            .single();


    if (error) {
        throw error;
    }


    return newCart;

}



/* ========================================
   ADD ITEM TO CART
======================================== */

router.post("/items", async (req, res) => {

    try {

        const {
            cartToken,
            productId,
            variantId,
            quantity = 1
        } = req.body;


        if (
            !productId ||
            !variantId ||
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid cart item."
            });

        }


        /* --------------------------------
           VALIDATE PRODUCT
        -------------------------------- */

        const { data: product, error: productError } =
            await supabase
                .from("products")
                .select("id, active")
                .eq("id", productId)
                .eq("active", true)
                .maybeSingle();


        if (productError) {
            throw productError;
        }


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found."
            });

        }


        /* --------------------------------
           VALIDATE VARIANT
        -------------------------------- */

        const { data: variant, error: variantError } =
            await supabase
                .from("product_variants")
                .select("id, product_id, active")
                .eq("id", variantId)
                .eq("product_id", productId)
                .eq("active", true)
                .maybeSingle();


        if (variantError) {
            throw variantError;
        }


        if (!variant) {

            return res.status(404).json({
                success: false,
                message: "Product size not found."
            });

        }


        /* --------------------------------
           FIND OR CREATE CART
        -------------------------------- */

        const cart =
            await getOrCreateCart(cartToken);


        /* --------------------------------
           CHECK FOR EXISTING ITEM
        -------------------------------- */

        const { data: existingItem, error: existingItemError } =
            await supabase
                .from("cart_items")
                .select("id, quantity")
                .eq("cart_id", cart.id)
                .eq("variant_id", variantId)
                .maybeSingle();


        if (existingItemError) {
            throw existingItemError;
        }


        let cartItem;


        if (existingItem) {

            const newQuantity =
                existingItem.quantity + quantity;


            const { data, error } =
                await supabase
                    .from("cart_items")
                    .update({
                        quantity: newQuantity
                    })
                    .eq("id", existingItem.id)
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            cartItem = data;

        } else {

            const { data, error } =
                await supabase
                    .from("cart_items")
                    .insert({
                        cart_id: cart.id,
                        product_id: productId,
                        variant_id: variantId,
                        quantity
                    })
                    .select()
                    .single();


            if (error) {
                throw error;
            }


            cartItem = data;

        }


        /* --------------------------------
           UPDATE CART TIMESTAMP
        -------------------------------- */

        await supabase
            .from("carts")
            .update({
                updated_at: new Date().toISOString()
            })
            .eq("id", cart.id);


        res.json({
            success: true,
            cartToken: cart.cart_token,
            cartItem
        });


    } catch (error) {

        console.error(
            "Add to cart error:",
            error.message
        );


        res.status(500).json({
            success: false,
            message: "Unable to add item to cart."
        });

    }

});

/* ========================================
   GET ACTIVE CART
======================================== */

router.get("/:cartToken", async (req, res) => {

    try {

        const { cartToken } = req.params;


        const { data: cart, error: cartError } =
            await supabase
                .from("carts")
                .select(`
                    id,
                    cart_token,
                    status,
                    coupon_id,
                    cart_items (
                        id,
                        quantity,
                        product_id,
                        variant_id,
                        products (
                            id,
                            name,
                            slug,
                            image_url
                        ),
                        product_variants (
                            id,
                            size,
                            price
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
                message: "Cart not found."
            });

        }
        const items =
    cart.cart_items || [];

let subtotal = 0;

items.forEach((item) => {

    const price =
        Number(
            item.product_variants.price
        );

    subtotal +=
        price * item.quantity;

});

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

    if (coupon && coupon.active) {

    appliedCoupon = coupon;

    if (
        coupon.discount_type ===
        "percentage"
    ) {

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


}
const shipping =
    subtotal >= 45
        ? 0
        : 6.95;


const total =
    discountedSubtotal + shipping;

        res.json({
    success: true,
    cart,
    pricing: {
    subtotal,
    discountAmount,
    discountedSubtotal,
    shipping,
    total,
    freeShipping:
        shipping === 0,
    appliedCoupon: appliedCoupon
        ? {
            code: appliedCoupon.code,
            discountType:
                appliedCoupon.discount_type,
            discountValue:
                Number(
                    appliedCoupon.discount_value
                )
        }
        : null
}
});


    } catch (error) {

        console.error(
            "Get cart error:",
            error.message
        );


        res.status(500).json({
            success: false,
            message: "Unable to load cart."
        });

    }

});
/* ========================================
   UPDATE CART ITEM QUANTITY
======================================== */

router.patch("/items/:itemId", async (req, res) => {

    try {

        const { itemId } = req.params;
        const { quantity } = req.body;


        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {

            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1."
            });

        }


        const { data: updatedItem, error } =
            await supabase
                .from("cart_items")
                .update({
                    quantity
                })
                .eq("id", itemId)
                .select()
                .single();


        if (error) {
            throw error;
        }


        res.json({
            success: true,
            cartItem: updatedItem
        });


    } catch (error) {

        console.error(
            "Update cart item error:",
            error.message
        );


        res.status(500).json({
            success: false,
            message: "Unable to update cart item."
        });

    }

});
/* ========================================
   REMOVE CART ITEM
======================================== */

router.delete("/items/:itemId", async (req, res) => {

    try {

        const { itemId } = req.params;


        const { data: cartItem, error: findError } =
            await supabase
                .from("cart_items")
                .select("id, cart_id")
                .eq("id", itemId)
                .maybeSingle();


        if (findError) {
            throw findError;
        }


        if (!cartItem) {

            return res.status(404).json({
                success: false,
                message: "Cart item not found."
            });

        }


        const { error: deleteError } =
            await supabase
                .from("cart_items")
                .delete()
                .eq("id", itemId);


        if (deleteError) {
            throw deleteError;
        }


        await supabase
            .from("carts")
            .update({
                updated_at: new Date().toISOString()
            })
            .eq("id", cartItem.cart_id);


        res.json({
            success: true,
            removedItemId: Number(itemId)
        });


    } catch (error) {

        console.error(
            "Remove cart item error:",
            error.message
        );


        res.status(500).json({
            success: false,
            message: "Unable to remove cart item."
        });

    }

});
module.exports = router;