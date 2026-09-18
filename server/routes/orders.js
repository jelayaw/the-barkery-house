const express = require("express");
const router = express.Router();

const supabase =
    require("../services/supabase");

const sendShippingConfirmation =
    require("../services/send-shipping-confirmation");

router.get(
    "/lookup",
    async (req, res) => {

        try {

            const {
                orderId,
                email
            } = req.query;


            if (
                !orderId ||
                !email
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order number and email are required."
                });

            }


            const {
                data: order,
                error
            } =
                await supabase
                    .from("orders")
                    .select(
                        "id, customer_name, customer_email, status, carrier, tracking_number, shipped_at"
                    )
                    .eq(
                        "id",
                        orderId
                    )
                    .eq(
                        "customer_email",
                        email
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!order) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found."
                });

            }

            const statusLabels = {
    paid:
        "Order Confirmed",

    processing:
        "Preparing Your Treats",

    shipped:
        "Shipped"
};


const statusLabel =
    statusLabels[order.status] ||
    "Order Status Updated";


            return res.json({
    success: true,
    order: {
        ...order,
        statusLabel:
            statusLabel
    }
});


        } catch (error) {

            console.error(
                "Order lookup error:",
                error.message
            );


            return res.status(500).json({
                success: false,
                message:
                    "Unable to look up order."
            });

        }

    }
);

router.patch(
    "/:orderId/process",
    async (req, res) => {

        try {

            const orderId =
                req.params.orderId;


            const {
                data: order,
                error
            } =
                await supabase
                    .from("orders")
                    .update({
                        status:
                            "processing"
                    })
                    .eq(
                        "id",
                        orderId
                    )
                    .eq(
                        "status",
                        "paid"
                    )
                    .select(
                        "id, customer_email, customer_name, status"
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!order) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Paid order not found."
                });

            }


            return res.json({
                success: true,
                message:
                    "Order is now processing.",
                order
            });


        } catch (error) {

            console.error(
                "Process order error:",
                error.message
            );


            return res.status(500).json({
                success: false,
                message:
                    "Unable to update order processing status."
            });

        }

    }
);


router.patch(
    "/:orderId/ship",
    async (req, res) => {

        try {

            const orderId =
                req.params.orderId;

            const {
                carrier,
                trackingNumber
            } = req.body;


            if (
                !carrier ||
                !trackingNumber
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Carrier and tracking number are required."
                });

            }


            const {
                data: order,
                error
            } =
                await supabase
                    .from("orders")
                    .select(
                        "id, customer_email, customer_name, status"
                    )
                    .eq(
                        "id",
                        orderId
                    )
                    .eq(
                        "status",
                        "processing"
                    )
                    .maybeSingle();


            if (error) {
                throw error;
            }


            if (!order) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Processing order not found."
                });

            }


            const emailResult =
                await sendShippingConfirmation({
                    to:
                        order.customer_email,

                    orderId:
                        order.id,

                    customerName:
                        order.customer_name,

                    carrier:
                        carrier,

                    trackingNumber:
                        trackingNumber
                });


            console.log(
                "Shipping confirmation email sent:",
                {
                    orderId:
                        order.id,

                    emailId:
                        emailResult
                            ? emailResult.id
                            : null
                }
            );


            const shippedAt =
                new Date().toISOString();


            const {
                data: shippedOrder,
                error: updateError
            } =
                await supabase
                    .from("orders")
                    .update({
                        status:
                            "shipped",

                        carrier:
                            carrier,

                        tracking_number:
                            trackingNumber,

                        shipped_at:
                            shippedAt
                    })
                    .eq(
                        "id",
                        orderId
                    )
                    .eq(
                        "status",
                        "processing"
                    )
                    .select(
                        "id, customer_email, customer_name, status, carrier, tracking_number, shipped_at"
                    )
                    .maybeSingle();


            if (updateError) {
                throw updateError;
            }


            if (!shippedOrder) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Processing order could not be updated."
                });

            }


            return res.json({
                success: true,
                message:
                    "Order marked as shipped.",
                order:
                    shippedOrder
            });


        } catch (error) {

            console.error(
                "Ship order error:",
                error.message
            );


            return res.status(500).json({
    success: false,
    message:
        "Shipping email failed. Order remains processing."
});

        }

    }
);


module.exports = router;