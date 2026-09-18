const resend =
    require("./email");

async function sendContactMessage({
    name,
    email,
    orderNumber,
    subject,
    message
}) {

    const emailSubject =
        `Contact Form: ${subject}`;

const html = `
    <div
        style="
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #2f2a25;
            background-color: #fffaf5;
            padding: 30px;
        "
    >

        <div
            style="
                max-width: 620px;
                margin: 0 auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 14px;
                border: 1px solid #eadfd4;
            "
        >

            <h2
                style="
                    margin-top: 0;
                    color: #2f3e2f;
                "
            >
                New Customer Message Received 🐾
            </h2>

            <p>
                A customer submitted a message through
                The Barkery House contact form.
            </p>

            <p>
                Please review the request and respond
                within 1–2 business days.
            </p>

            <hr
                style="
                    border: 0;
                    border-top: 1px solid #eadfd4;
                    margin: 25px 0;
                "
            >

            <p>
                <strong>Name:</strong><br>
                ${name}
            </p>

            <p>
                <strong>Email:</strong><br>
                ${email}
            </p>

            ${
                orderNumber
                    ? `
                        <p>
                            <strong>Order Number:</strong><br>
                            ${orderNumber}
                        </p>
                    `
                    : ""
            }

            <p>
                <strong>Subject:</strong><br>
                ${subject}
            </p>

            <p>
                <strong>Customer Message:</strong>
            </p>

            <div
                style="
                    background-color: #f7efe6;
                    padding: 18px;
                    border-radius: 10px;
                "
            >
                ${message}
            </div>

            <p
                style="
                    margin-top: 28px;
                    font-size: 13px;
                    color: #6f6258;
                "
            >
                This message was sent through
                The Barkery House website contact form.
            </p>

        </div>

    </div>
`;

    const {
        data,
        error
    } =
        await resend.emails.send({
            from:
                "The Barkery House <onboarding@resend.dev>",

            to:
                ["jelayaw@yahoo.com"],

            replyTo:
                email,

            subject:
                emailSubject,

            html:
                html
        });

    if (error) {
        throw new Error(
            error.message
        );
    }

    return data;
}

module.exports =
    sendContactMessage;