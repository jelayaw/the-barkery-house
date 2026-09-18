const express =
    require("express");

const sendContactMessage =
    require("../services/send-contact-message");

const router =
    express.Router();

router.post(
    "/",
    async (req, res) => {

        try {

            const {
                name,
                email,
                orderNumber,
                subject,
                message
            } = req.body;

            if (
                !name ||
                !email ||
                !subject ||
                !message
            ) {

                return res
                    .status(400)
                    .json({
                        error:
                            "Name, email, subject, and message are required."
                    });

            }

            await sendContactMessage({
                name,
                email,
                orderNumber,
                subject,
                message
            });

            return res.json({
                success: true,
                message:
                    "Your message has been sent."
            });

        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );

            return res
                .status(500)
                .json({
                    error:
                        "Unable to send your message right now."
                });

        }

    }
);

module.exports =
    router;