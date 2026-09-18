const express = require("express");
const router = express.Router();

const stripe =
    require("../services/stripe");


router.get("/", async (req, res) => {

    try {

        const sessionId =
            req.query.session_id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message:
                    "Missing Stripe session ID."
            });
        }

        const session =
            await stripe.checkout.sessions.retrieve(
                sessionId
            );

        const isPaid =
            session.payment_status === "paid";

        res.json({
    success: true,
    paid: isPaid,
    sessionId: session.id,
    orderId:
        session.metadata
            ? session.metadata.order_id
            : null
});

    } catch (error) {

        console.error(
            "Order confirmation error:",
            error.message
        );

        res.status(500).json({
            success: false,
            message:
                "Unable to verify payment."
        });

    }

});


module.exports = router;