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
   PRODUCT DETAILS
======================================== */

const productDetail =
    document.getElementById("product-detail");


const params =
    new URLSearchParams(window.location.search);


const productSlug =
    params.get("product");



async function loadProduct() {

    try {

        if (!productSlug) {
            throw new Error(
                "No product was selected."
            );
        }


        const response =
            await fetch("/api/products");


        const data =
            await response.json();


        if (!response.ok || !data.success) {
            throw new Error(
                "Unable to load products."
            );
        }


        const product =
            data.products.find(
                (item) =>
                    item.slug === productSlug
            );


        if (!product) {
            throw new Error(
                "Product not found."
            );
        }

displayProduct(product);

loadRelatedProducts(
    product.id,
    data.products
);


    } catch (error) {

        console.error(
            "Product page error:",
            error.message
        );


        productDetail.innerHTML = `

            <div class="product-page-error">

                <h1>Oops!</h1>

                <p>
                    We couldn't find that treat.
                </p>

                <a href="shop.html">
                    Back to Shop
                </a>

            </div>

        `;

    }

}



/* ========================================
   DISPLAY PRODUCT
======================================== */

function displayProduct(product) {

    const activeVariants =
        product.product_variants
            .filter((variant) => variant.active)
            .sort(
                (a, b) =>
                    Number(a.price) -
                    Number(b.price)
            );


    if (activeVariants.length === 0) {

        throw new Error(
            "This product has no available sizes."
        );

    }


    const startingPrice =
        Number(activeVariants[0].price);

        document.title =
    `${product.name} | The Barkery House`;

    const metaDescription =
    document.querySelector(
        'meta[name="description"]'
    );

if (metaDescription) {
    metaDescription.setAttribute(
        "content",
        `Shop ${product.name}, a freshly made dog treat from The Barkery House.`
    );
}

    productDetail.innerHTML = `

        <div class="product-detail-image">

            <img
                src="${product.image_url}"
                alt="${product.name}"
                width="1200"
                height="900"
                decoding="async"
            >

        </div>


        <div class="product-detail-content">

            <p class="eyebrow">
                MADE FRESH TO ORDER
            </p>


            <h1>
                ${product.name}
            </h1>


            <p class="product-detail-price">
                From $${startingPrice.toFixed(2)}
            </p>


            <p class="product-detail-description">
                ${product.description}
            </p>


            <div class="product-detail-info">

                <div>

                    <h2>Ingredients</h2>

                    <p>
                        ${product.ingredients}
                    </p>

                </div>


                ${
                    product.storage_instructions
                        ? `
                            <div>

                                <h2>Storage</h2>

                                <p>
                                    ${product.storage_instructions}
                                </p>

                            </div>
                        `
                        : ""
                }


                ${
                    product.shelf_life
                        ? `
                            <div>

                                <h2>Freshness</h2>

                                <p>
                                    ${product.shelf_life}
                                </p>

                            </div>
                        `
                        : ""
                }

            </div>


            <div class="product-size-section">

                <h2>
                    Choose a Size
                </h2>


                <div class="product-size-options">

                    ${activeVariants
                        .map(
                            (variant) => `

                                <button
                                    class="size-option"
                                    type="button"
                                    data-variant-id="${variant.id}"
                                    data-price="${variant.price}"
                                >

                                    <span>
                                        ${variant.size}
                                    </span>

                                    <strong>
                                        $${Number(
                                            variant.price
                                        ).toFixed(2)}
                                    </strong>

                                </button>
            

            
                            `
                        )
                        .join("")}

                </div>

            </div>

            <div class="product-quantity-section">

                <h2>
                    Quantity
                </h2>

                <div class="quantity-controls">

                    <button
                        class="quantity-button quantity-minus"
                        type="button"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span
                        class="quantity-value"
                        aria-live="polite"
                    >
                        1
                    </span>

                    <button
                        class="quantity-button quantity-plus"
                        type="button"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>

            </div>
            <button
                class="add-to-cart-button"
                type="button"
                disabled
            >
                Select a Size
            </button>


            <p class="product-processing-note">

                Made fresh for your pup.
                Please allow
                ${product.processing_days_min}–${product.processing_days_max}
                business days for preparation.

            </p>

        </div>

    `;




setupVariantSelection(product);

}



/* ========================================
   SIZE SELECTION
======================================== */

function setupVariantSelection(product) {

    const sizeOptions =
        document.querySelectorAll(
            ".size-option"
        );


    const addToCartButton =
        document.querySelector(
            ".add-to-cart-button"
        );

        const quantityMinus =
    document.querySelector(
        ".quantity-minus"
    );


const quantityPlus =
    document.querySelector(
        ".quantity-plus"
    );


const quantityValue =
    document.querySelector(
        ".quantity-value"
    );


let quantity = 1;

quantityMinus.addEventListener(
    "click",
    () => {

        if (quantity > 1) {
            quantity--;
        }

        quantityValue.textContent =
            quantity;

    }
);


quantityPlus.addEventListener(
    "click",
    () => {

        quantity++;

        quantityValue.textContent =
            quantity;

    }
);


    let selectedVariantId = null;


    sizeOptions.forEach((option) => {

        option.addEventListener(
            "click",
            () => {

                sizeOptions.forEach(
                    (button) =>
                        button.classList.remove(
                            "selected"
                        )
                );


                option.classList.add(
                    "selected"
                );


                selectedVariantId =
                    Number(
                        option.dataset.variantId
                    );


                const price =
                    Number(
                        option.dataset.price
                    );


                addToCartButton.disabled =
                    false;


                addToCartButton.textContent =
                    `Add to Cart — $${price.toFixed(2)}`;

            }
        );

    });



    /* ========================================
       ADD SELECTED ITEM TO CART
    ======================================== */

    addToCartButton.addEventListener(
        "click",
        async () => {

            if (!selectedVariantId) {
                return;
            }


            try {

                addToCartButton.disabled = true;

                addToCartButton.textContent =
                    "Adding to Cart...";


                const existingCartToken =
                    localStorage.getItem(
                        "barkeryCartToken"
                    );


                const response =
                    await fetch(
                        "/api/cart/items",
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                cartToken:
                                    existingCartToken,
                                productId:
                                    product.id,
                                variantId:
                                    selectedVariantId,
                                quantity: quantity
                            })

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
                        "Unable to add item."
                    );

                }


                localStorage.setItem(
                    "barkeryCartToken",
                    data.cartToken
                );


                addToCartButton.textContent =
                    "Added to Cart ✓";


                setTimeout(() => {

                    const selectedOption =
                        document.querySelector(
                            ".size-option.selected"
                        );


                    if (selectedOption) {

                        const price =
                            Number(
                                selectedOption.dataset.price
                            );


                        addToCartButton.textContent =
                            `Add to Cart — $${price.toFixed(2)}`;

                    }


                    addToCartButton.disabled =
                        false;

                }, 1200);


            } catch (error) {

                console.error(
                    "Add to cart error:",
                    error.message
                );


                addToCartButton.textContent =
                    "Try Again";


                addToCartButton.disabled =
                    false;

            }

        }
    );

}



loadProduct();

function loadRelatedProducts(
    currentProductId,
    products
) {

    const relatedProducts =
        products
            .filter(
                (product) =>
                    product.id !== currentProductId
            )
            .slice(0, 3);

    displayRelatedProducts(
        relatedProducts
    );

}
function displayRelatedProducts(products) {

    const relatedProductsContainer =
        document.getElementById(
            "related-products"
        );

    if (!relatedProductsContainer) {
        return;
    }

    relatedProductsContainer.innerHTML =
        products
            .map(
                (product) => `
                    <a
                        href="product.html?product=${product.slug}"
                        class="related-product-card"
                    >
                        <img
                            src="${product.image_url}"
                            alt="${product.name}"
                            loading="lazy"
                        >

                        <div class="related-product-info">

                            <span>
                                MADE FRESH TO ORDER
                            </span>

                            <h3>
                                ${product.name}
                            </h3>

                            <p>
                                View Treat
                            </p>

                        </div>
                    </a>
                `
            )
            .join("");

            const relatedProductsSection =
    document.getElementById(
        "related-products-section"
    );

if (relatedProductsSection) {
    relatedProductsSection.hidden = false;
}

}