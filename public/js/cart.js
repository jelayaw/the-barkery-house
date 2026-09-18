/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuToggle =
    document.querySelector(".menu-toggle");

const navLinks =
    document.querySelector(".nav-links");


if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            navLinks.classList.toggle("active");


        menuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );


        menuToggle.setAttribute(
            "aria-label",
            isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
        );

    });

}



/* ========================================
   CART
======================================== */

const cartContent =
    document.getElementById("cart-content");


const cartToken =
    localStorage.getItem(
        "barkeryCartToken"
    );



async function loadCart() {

    try {

        if (!cartToken) {

            displayEmptyCart();

            return;

        }


        const response =
            await fetch(
                `/api/cart/${cartToken}`
            );


        const data =
            await response.json();


        if (response.status === 404) {

            localStorage.removeItem(
                "barkeryCartToken"
            );

            displayEmptyCart();

            return;

        }


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to load cart."
            );

        }


        displayCart(
    data.cart,
    data.pricing
);


    } catch (error) {

        console.error(
            "Cart page error:",
            error.message
        );


        cartContent.innerHTML = `

            <div class="cart-error">

                <h2>
                    We couldn't load your treats.
                </h2>

                <p>
                    Please try again in a moment.
                </p>

            </div>

        `;

    }

}



/* ========================================
   DISPLAY CART
======================================== */

function displayCart(cart, pricing) {

    const items =
        cart.cart_items || [];


    if (items.length === 0) {

        displayEmptyCart();

        return;

    }


    const subtotal = Number(pricing.subtotal);


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

                <article class="cart-item">

                    <a
                        href="product.html?product=${product.slug}"
                        class="cart-item-image"
                    >

                        <img
                            src="${product.image_url}"
                            alt="${product.name}"
                            width="1200"
                            height="900"
                            loading="lazy"
                            decoding="async"
                        >

                    </a>


                    <div class="cart-item-details">

                        <p class="cart-item-label">
                            MADE FRESH TO ORDER
                        </p>

                        <h2>

                            <a
                                href="product.html?product=${product.slug}"
                            >
                                ${product.name}
                            </a>

                        </h2>

                        <p class="cart-item-size">
                            Size: ${variant.size}
                        </p>

                        <p class="cart-item-price">
                            $${price.toFixed(2)} each
                        </p>

                        <div
    class="cart-quantity-controls"
    data-item-id="${item.id}"
>

    <button
        type="button"
        class="quantity-button quantity-minus"
        aria-label="Decrease ${product.name} quantity"
        ${item.quantity <= 1 ? "disabled" : ""}
    >
        −
    </button>

    <span
        class="quantity-number"
        aria-live="polite"
    >
        ${item.quantity}
    </span>

    <button
        type="button"
        class="quantity-button quantity-plus"
        aria-label="Increase ${product.name} quantity"
    >
        +
    </button>

    </div>

<button
    type="button"
    class="cart-remove-button"
    data-item-id="${item.id}"
    aria-label="Remove ${product.name} from cart"
>
    Remove
</button>

                    </div>


                    <div class="cart-item-total">

                        $${itemTotal.toFixed(2)}

                    </div>

                </article>

            `;

        }).join("");


    cartContent.innerHTML = `

        <div class="cart-items">

            ${itemMarkup}

        </div>


        <aside class="cart-summary">

            <p class="eyebrow">
                ORDER SUMMARY
            </p>

            <div class="cart-summary-row">

                <span>Subtotal</span>

                <strong>
                    $${subtotal.toFixed(2)}
                </strong>

            </div>
            <div
    <div
    class="cart-summary-row discount-row"
    id="discount-row"
    ${Number(pricing.discountAmount) > 0
        ? ""
        : "hidden"}
>
    <span>Discount</span>

    <span id="discount-amount">
        -$${Number(
            pricing.discountAmount || 0
        ).toFixed(2)}
    </span>
</div>
   

      
    
            
<div class="cart-coupon">

    <label for="coupon-code">
        Coupon Code
    </label>

    <div class="cart-coupon-form">

        <input
            type="text"
            id="coupon-code"
            placeholder="Enter coupon code"
            autocomplete="off"
            value="${pricing.appliedCoupon
                ? pricing.appliedCoupon.code
                : ""}"
        >

        <button
            type="button"
            id="apply-coupon-button"
        >
            Apply
        </button>

    </div>

    <div class="coupon-status">

    <p
        class="coupon-message"
        id="coupon-message"
    >
        ${pricing.appliedCoupon
            ? `${pricing.appliedCoupon.code} applied! You saved $${Number(
                pricing.discountAmount
            ).toFixed(2)}.`
            : ""}
    </p>

    <button
        type="button"
        class="remove-coupon-button"
        id="remove-coupon-button"
        ${pricing.appliedCoupon
            ? ""
            : "hidden"}
    >
        Remove
    </button>

</div>

</div>
                <span>Shipping</span>

                <span>
    ${Number(pricing.shipping) === 0
        ? "FREE"
        : `$${Number(pricing.shipping).toFixed(2)}`}
</span>

            </div>


            <div class="cart-summary-total">

                <span>Estimated Total</span>

                <span
    id="estimated-total"
    data-original-total="${Number(pricing.total).toFixed(2)}"
>
    $${Number(pricing.total).toFixed(2)}
</span>

            </div>


            <a
                href="checkout.html"
                class="cart-checkout-button"
            >
                Continue to Checkout
            </a>


            <a
                href="shop.html"
                class="cart-continue-link"
            >
                ← Continue Shopping
            </a>


            <p class="cart-shipping-note">
                Free standard shipping on
                orders $45+.
            </p>

        </aside>

    `;
    setupQuantityControls();
    setupRemoveButtons();
    setupCouponForm();


}
function setupCouponForm() {
    const couponInput =
        document.getElementById("coupon-code");

    const applyButton =
        document.getElementById("apply-coupon-button");

        const removeButton =
    document.getElementById("remove-coupon-button");

    const couponMessage =
        document.getElementById("coupon-message");

    if (
        !couponInput ||
        !applyButton ||
        !couponMessage
    ) {
        return;
    }
    couponInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        applyButton.click();
    }
    
});

    applyButton.addEventListener("click", async () => {
    const code = couponInput.value.trim();

    const cartToken =
        localStorage.getItem("barkeryCartToken");
        
        if (!code) {
    couponMessage.classList.add("error");
    couponMessage.textContent =
        "Please enter a coupon code.";
        const discountRow =
    document.getElementById("discount-row");

discountRow.hidden = true;
const estimatedTotal =
    document.getElementById("estimated-total");

const originalTotal =
    estimatedTotal.dataset.originalTotal;

estimatedTotal.textContent =
    `$${Number(originalTotal).toFixed(2)}`;
    return;
}

applyButton.disabled = true;
applyButton.textContent = "Applying...";

    try {
    const response = await fetch(
        "/api/coupons/validate",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                code,
                cartToken
            })
        }
    );

    const data = await response.json();

    if (data.success) {
        couponMessage.classList.remove("error");

        couponMessage.textContent =
            `${data.coupon.code} applied! You saved $${Number(data.discountAmount).toFixed(2)}.`;

        const discountRow =
            document.getElementById("discount-row");

        const discountAmount =
            document.getElementById("discount-amount");

        discountAmount.textContent =
            `-$${Number(data.discountAmount).toFixed(2)}`;

        discountRow.hidden = false;

        const estimatedTotal =
            document.getElementById("estimated-total");

        estimatedTotal.textContent =
            `$${Number(data.total).toFixed(2)}`;
    } else {

    couponMessage.classList.add("error");

    couponMessage.textContent =
        data.message ||
        "That coupon code is not valid.";

}
} catch (error) {
    console.error(
        "Coupon error:",
        error.message
    );

    couponMessage.classList.add("error");

    couponMessage.textContent =
        "We couldn't check that coupon. Please try again.";

    const discountRow =
        document.getElementById("discount-row");

    discountRow.hidden = true;

    const estimatedTotal =
        document.getElementById("estimated-total");

    const originalTotal =
        estimatedTotal.dataset.originalTotal;

    estimatedTotal.textContent =
        `$${Number(originalTotal).toFixed(2)}`;
} finally {
    applyButton.disabled = false;
    applyButton.textContent = "Apply";
}


});
if (removeButton) {

    removeButton.addEventListener(
        "click",
        async () => {

            const cartToken =
                localStorage.getItem(
                    "barkeryCartToken"
                );

            removeButton.disabled = true;
            removeButton.textContent =
                "Removing...";

            try {

                const response =
                    await fetch(
                        "/api/coupons/remove",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                cartToken
                            })
                        }
                    );

                const data =
                    await response.json();

                if (data.success) {
                    window.location.reload();
                }

            } catch (error) {

                console.error(
                    "Remove coupon error:",
                    error.message
                );

            } finally {

                removeButton.disabled = false;
                removeButton.textContent =
                    "Remove";

            }

        }
    );

}
}
/* ========================================
   QUANTITY CONTROLS
======================================== */

function setupQuantityControls() {

    const quantityControls =
        document.querySelectorAll(
            ".cart-quantity-controls"
        );


    quantityControls.forEach((control) => {

        const itemId =
            control.dataset.itemId;

        const minusButton =
            control.querySelector(
                ".quantity-minus"
            );

        const plusButton =
            control.querySelector(
                ".quantity-plus"
            );

        const quantityNumber =
            control.querySelector(
                ".quantity-number"
            );


        minusButton.addEventListener(
            "click",
            () => {

                const currentQuantity =
                    Number(
                        quantityNumber.textContent
                    );


                if (currentQuantity > 1) {

                    updateCartQuantity(
                        itemId,
                        currentQuantity - 1
                    );

                }

            }
        );


        plusButton.addEventListener(
            "click",
            () => {

                const currentQuantity =
                    Number(
                        quantityNumber.textContent
                    );


                updateCartQuantity(
                    itemId,
                    currentQuantity + 1
                );

            }
        );

    });

}



/* ========================================
   UPDATE CART QUANTITY
======================================== */
async function updateCartQuantity(
    itemId,
    quantity
) {

    try {

        const response =
            await fetch(
                `/api/cart/items/${itemId}`,
                {
                    method: "PATCH",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        quantity
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok || !data.success) {

            throw new Error(
                data.message ||
                "Unable to update quantity."
            );

        }


        await loadCart();


    } catch (error) {

        console.error(
            "Quantity update error:",
            error.message
        );

    }

}
/* ========================================
   REMOVE CART ITEM
======================================== */

function setupRemoveButtons() {

    const removeButtons =
        document.querySelectorAll(
            ".cart-remove-button"
        );


    removeButtons.forEach((button) => {

        button.addEventListener(
            "click",
            async () => {

                const itemId =
                    button.dataset.itemId;


                try {

                    button.disabled = true;
                    button.textContent =
                        "Removing...";


                    const response =
                        await fetch(
                            `/api/cart/items/${itemId}`,
                            {
                                method: "DELETE"
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.message ||
                            "Unable to remove item."
                        );

                    }


                    await loadCart();


                } catch (error) {

                    console.error(
                        "Remove item error:",
                        error.message
                    );


                    button.disabled = false;
                    button.textContent =
                        "Remove";

                }

            }
        );

    });

}

/* ========================================
   EMPTY CART
======================================== */

function displayEmptyCart() {

    cartContent.innerHTML = `

        <div class="empty-cart">

            <div
                class="empty-cart-icon"
                aria-hidden="true"
            >
                🐾
            </div>

            <h2>
                Your Barkery Bag is empty.
            </h2>

            <p>
                Somebody's treat jar looks
                suspiciously empty.
            </p>

            <a
                href="shop.html"
                class="empty-cart-button"
            >
                Shop Fresh Treats
            </a>

        </div>

    `;

}



loadCart();