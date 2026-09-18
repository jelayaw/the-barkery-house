const resend =
    require("./email");


async function sendShippingConfirmation({
    to,
    orderId,
    customerName,
    carrier,
    trackingNumber
}) {

        let trackingUrl = "";

    if (carrier === "USPS") {
        trackingUrl =
            `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
    }

    if (carrier === "UPS") {
        trackingUrl =
            `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }

    if (carrier === "FedEx") {
        trackingUrl =
            `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }

    const { data, error } =
        await resend.emails.send({
            from:
                "The Barkery House <onboarding@resend.dev>",

            to,

            subject:
                `Order #${orderId} has shipped!`,

            html: `
                <div
                    style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 24px;
                    "
                >

                    <div
                        style="
                            text-align: center;
                            margin-bottom: 28px;
                        "
                    >

                        <div
                            style="
                                font-size: 13px;
                                letter-spacing: 2px;
                                text-transform: uppercase;
                                margin-bottom: 8px;
                            "
                        >
                            The Barkery House
                        </div>

                        <h1
                            style="
                                margin: 0;
                                font-size: 30px;
                            "
                        >
                            Your Order Is On The Way!
                        </h1>

                    </div>

                    <p>
                        Hi ${customerName},
                    </p>

                    <p>
                        Great news! Order #${orderId}
                        has been shipped.
                    </p>

                    <div
                        style="
                            background: #faf7f2;
                            border: 1px solid #e4d6c6;
                            border-radius: 14px;
                            padding: 18px 20px;
                            margin: 24px 0;
                        "
                    >

                        <p>
                            <strong>Carrier:</strong>
                            ${carrier}
                        </p>

                        <p>
                            <strong>Tracking Number:</strong>
                            ${trackingNumber}
                        </p>

                        ${
    trackingUrl
        ? `
            <a
                href="${trackingUrl}"
                style="
                    display: inline-block;
                    margin-top: 10px;
                    padding: 12px 18px;
                    background: #2f3e2f;
                    color: #ffffff;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 700;
                "
            >
                Track Your Package
            </a>
        `
        : ""
}

                    </div>

                    <p>
                        Your pup's treats are officially
                        on the way!
                    </p>

                    <p>
                        Thanks for shopping with
                        The Barkery House!
                    </p>

                </div>
            `
        });


    if (error) {
        throw new Error(
            error.message
        );
    }


    return data;
}


module.exports =
    sendShippingConfirmation;