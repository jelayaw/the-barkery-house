document.addEventListener(
    "DOMContentLoaded",
    loadCheckout
);

document.addEventListener(
    "DOMContentLoaded",
    setupCheckoutForm
);


async function loadCheckout() {

    const cartToken =
        localStorage.getItem(
            "barkeryCartToken"
        );

    const summaryContent =
        document.getElementById(
            "checkout-summary-content"
        );


    if (!cartToken) {

        summaryContent.innerHTML = `
            <p>
                Your cart is empty.
            </p>

            <a href="shop.html">
                Shop Treats
            </a>
        `;

        return;
    }


    try {

        const response =
            await fetch(
                `/api/cart/${cartToken}`
            );

        const data =
            await response.json();


        if (!response.ok || !data.success) {

            summaryContent.innerHTML = `
                <p>
                    Your cart is empty.
                </p>

                <a href="shop.html">
                    Shop Treats
                </a>
            `;

            return;
        }


        displayCheckoutSummary(
    data.cart,
    data.pricing
);

    } catch (error) {

        console.error(
            "Checkout load error:",
            error.message
        );

        summaryContent.innerHTML = `
            <p>
                We couldn't load your order.
                Please refresh and try again.
            </p>
        `;

    }

}

function displayCheckoutSummary(
    cart,
    pricing
) {

    const summaryContent =
        document.getElementById(
            "checkout-summary-content"
        );

    const items =
        cart.cart_items || [];

    const itemMarkup =
        items.map((item) => {

            const product =
                item.products;

            const variant =
                item.product_variants;

            const price =
                Number(variant.price);

            const itemTotal =
                price * item.quantity;

            return `
                <div class="checkout-summary-item">

                    <div class="checkout-summary-item-info">

                        <strong>
                            ${product.name}
                        </strong>

                        <span>
                            ${variant.size}
                            ×
                            ${item.quantity}
                        </span>

                    </div>

                    <span>
                        $${itemTotal.toFixed(2)}
                    </span>

                </div>
            `;

        })
        .join("");

    summaryContent.innerHTML = `

        <div class="checkout-summary-items">
            ${itemMarkup}
        </div>

        <div class="checkout-summary-row">

            <span>Subtotal</span>

            <span>
                $${Number(
                    pricing.subtotal
                ).toFixed(2)}
            </span>

        </div>

        ${Number(pricing.discountAmount) > 0
            ? `
                <div class="checkout-summary-row checkout-discount">

                    <span>
                        ${pricing.appliedCoupon.code}
                    </span>

                    <span>
                        -$${Number(
                            pricing.discountAmount
                        ).toFixed(2)}
                    </span>

                </div>
            `
            : ""
        }

        <div class="checkout-summary-row">

            <span>Shipping</span>

            <span>
                ${Number(pricing.shipping) === 0
                    ? "FREE"
                    : `$${Number(
                        pricing.shipping
                    ).toFixed(2)}`
                }
            </span>

        </div>

        <div class="checkout-summary-total-row">

            <strong>Total</strong>

            <strong>
                $${Number(
                    pricing.total
                ).toFixed(2)}
            </strong>

        </div>

    `;

}

function setupCheckoutForm() {

    const checkoutForm =
        document.getElementById(
            "checkout-form"
        );

    if (!checkoutForm) {
        return;
    }

    checkoutForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const formData =
    new FormData(checkoutForm);

const checkoutData = {
    email:
        formData.get("email"),

    firstName:
        formData.get("firstName"),

    lastName:
        formData.get("lastName"),

    addressLine1:
        formData.get("addressLine1"),

    addressLine2:
        formData.get("addressLine2"),

    city:
        formData.get("city"),

    state:
        formData.get("state"),

    postalCode:
        formData.get("postalCode"),

    phone:
        formData.get("phone")
};

const cartToken =
    localStorage.getItem(
        "barkeryCartToken"
    );

try {

    const response =
        await fetch(
            "/api/checkout",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    cartToken,
                    customer: checkoutData
                })
            }
        );

    const data =
        await response.json();

    if (
    response.ok &&
    data.success &&
    data.checkoutUrl
) {

    window.location.href =
        data.checkoutUrl;

    return;
}


console.error(
    "Checkout failed:",
    data
);

} catch (error) {

    console.error(
        "Checkout request error:",
        error.message
    );

}

        }
    );

}