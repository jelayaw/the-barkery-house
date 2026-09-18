const resend =
    require("./email");


async function sendOrderConfirmation({
    to,
    orderId,
    customerName,
    subtotal,
    discountAmount,
    shippingAmount,
    total,
    couponCode,
    items
}) {

    const itemRows =
    items
        .map(
            (item) => `
                <tr>
                    <td
                        style="
                            padding: 12px 0;
                            border-bottom: 1px solid #eee;
                        "
                    >
                        <strong>
                            ${item.product_name}
                        </strong>
                        <br>
                        <span
                            style="
                                font-size: 14px;
                                color: #666;
                            "
                        >
                            ${item.variant_name}
                        </span>
                    </td>

                    <td
                        style="
                            padding: 12px 0;
                            border-bottom: 1px solid #eee;
                            text-align: center;
                        "
                    >
                        ${item.quantity}
                    </td>

                    <td
                        style="
                            padding: 12px 0;
                            border-bottom: 1px solid #eee;
                            text-align: right;
                        "
                    >
                        $${Number(item.line_total).toFixed(2)}
                    </td>
                </tr>
            `
        )
        .join("");

    const { data, error } =
        await resend.emails.send({
            from:
                "The Barkery House <onboarding@resend.dev>",

            to,

            subject:
                `Order #${orderId} confirmed`,

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
        Thank You for Your Order!
    </h1>

</div>

                    <p>
                        Hi ${customerName},
                    </p>

                    <p>
                        Your Barkery House order
                        has been confirmed.
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

    <div
        style="
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
        "
    >
        Order Confirmation
    </div>

    <div
        style="
            font-size: 22px;
            font-weight: 700;
        "
    >
        Order #${orderId}
    </div>

</div>

<table
    style="
        width: 100%;
        border-collapse: collapse;
        margin: 24px 0;
    "
>
    <thead>
        <tr>
            <th
                style="
                    text-align: left;
                    padding-bottom: 10px;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                "
            >
                Treat
            </th>

            <th
                style="
                    text-align: center;
                    padding-bottom: 10px;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                "
            >
                Qty
            </th>

            <th
                style="
                    text-align: right;
                    padding-bottom: 10px;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                "
            >
                Total
            </th>
        </tr>
    </thead>

    <tbody>
        ${itemRows}
    </tbody>
</table>

                    <div
    style="
        border-top: 1px solid #e4d6c6;
        border-bottom: 1px solid #e4d6c6;
        padding: 16px 0;
        margin: 24px 0;
    "
>
    <div
        style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        "
    >
        <span>
            Subtotal
        </span>

        <span>
            $${Number(subtotal).toFixed(2)}
        </span>
    </div>

    ${
        Number(discountAmount) > 0
            ? `
                <div
                    style="
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 10px;
                    "
                >
                    <span>
                        Discount${couponCode
                            ? ` (${couponCode})`
                            : ""}
                    </span>

                    <span>
                        -$${Number(discountAmount).toFixed(2)}
                    </span>
                </div>
            `
            : ""
    }

    <div
        style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 14px;
        "
    >
        <span>
            Shipping
        </span>

        <span>
            ${
                Number(shippingAmount) === 0
                    ? "FREE"
                    : `$${Number(shippingAmount).toFixed(2)}`
            }
        </span>
    </div>

    <div
        style="
            display: flex;
            justify-content: space-between;
            padding-top: 14px;
            border-top: 1px solid #e4d6c6;
            font-size: 20px;
            font-weight: 700;
        "
    >
        <span>
            Order Total
        </span>

        <span>
            $${Number(total).toFixed(2)}
        </span>
    </div>
</div>

                    <p>
                        Your treats are made fresh
                        to order. Please allow
                        3–5 business days for
                        preparation before shipping.
                    </p>

                    <p>
                        Thanks for treating your pup
                        with The Barkery House!
                    </p>

                                </div>
            `
        },
        {
            idempotencyKey:
                `barkery-order-confirmation/${orderId}`
        }
    );


    if (error) {
        throw new Error(
            error.message
        );
    }


    return data;
}


module.exports =
    sendOrderConfirmation;