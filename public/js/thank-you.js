const params =
    new URLSearchParams(
        window.location.search
    );

const sessionId =
    params.get("session_id");

const thankYouContainer =
    document.getElementById(
        "thank-you-container"
    );

console.log(
    "Thank-you Stripe session:",
    sessionId
);


async function verifyPayment() {

    if (!sessionId) {

        thankYouContainer.innerHTML = `
            <span class="thank-you-eyebrow">
                ORDER NOT VERIFIED
            </span>

            <h1>
                We Couldn't Confirm This Purchase
            </h1>

            <p>
                This page does not appear to be connected
                to a completed payment.
            </p>

            <a
                href="shop.html"
                class="thank-you-shop-button"
            >
                Return to Shop
            </a>
        `;

        console.error(
            "No Stripe session ID found."
        );

        return;
    }

    try {

        const response =
            await fetch(
                `/api/order-confirmation?session_id=${encodeURIComponent(sessionId)}`
            );

        const data =
            await response.json();

       

        if (
            response.ok &&
            data.success &&
            data.paid
        ) {

            localStorage.removeItem(
                "barkeryCartToken"
            );

            
            thankYouContainer.innerHTML = `
                <span class="thank-you-eyebrow">
                    ORDER CONFIRMED
                </span>

                <h1>
                    Thank You for Your Purchase!
                </h1>

                <p>
                    Your order has been received and
                    we're getting ready to bake up
                    something special for your pup.
                </p>

                <p>
                    <strong>
                        Order #${data.orderId}
                    </strong>
                </p>

                <div class="thank-you-next-steps">

    <h2>
        Made Fresh for Your Pup
    </h2>

    <p>
        Your treats are made fresh to order.
        Please allow 3–5 business days for
        your order to be prepared before shipping.
    </p>

</div>
                <p class="thank-you-email-note">
                    A confirmation email with your
                    order details will be sent to you.
                </p>

                <a
                    href="shop.html"
                    class="thank-you-shop-button"
                >
                    Continue Shopping
                </a>
            `;

        } else {

            thankYouContainer.innerHTML = `
                <span class="thank-you-eyebrow">
                    ORDER NOT VERIFIED
                </span>

                <h1>
                    We Couldn't Confirm This Purchase
                </h1>

                <p>
                    This page does not appear to be connected
                    to a completed payment.
                </p>

                <a
                    href="shop.html"
                    class="thank-you-shop-button"
                >
                    Return to Shop
                </a>
            `;

        }

    } catch (error) {

        console.error(
            "Payment verification error:",
            error.message
        );

    }

}


verifyPayment();