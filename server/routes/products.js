const express = require("express");
const router = express.Router();
const supabase = require("../services/supabase");

router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("products")
            .select(`
                id,
                name,
                slug,
                description,
                ingredients,
                allergen_info,
                storage_instructions,
                shelf_life,
                image_url,
                active,
                made_to_order,
                processing_days_min,
                processing_days_max,
                product_variants (
                    id,
                    size,
                    price,
                    active
                )
            `)
            .eq("active", true)
            .order("id");

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            products: data
        });
    } catch (error) {
        console.error("Product route error:", error.message);

        res.status(500).json({
            success: false,
            message: "Unable to load products."
        });
    }
});

module.exports = router;