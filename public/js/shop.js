/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {

    menuToggle.addEventListener("click", () => {

        const isOpen = navLinks.classList.toggle("active");

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
const productGrid = document.getElementById("product-grid");

async function loadProducts() {
    try {
        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error("Unable to load products.");
        }

        displayProducts(data.products);

    } catch (error) {
        console.error("Shop error:", error.message);

        productGrid.innerHTML = `
            <p class="shop-error">
                Sorry! We couldn't load our treats right now.
            </p>
        `;
    }
}


function displayProducts(products) {
    productGrid.innerHTML = "";

    products.forEach((product) => {

        const activeVariants = product.product_variants
            .filter((variant) => variant.active)
            .sort((a, b) => Number(a.price) - Number(b.price));

        if (activeVariants.length === 0) {
            return;
        }

        const startingPrice = Number(activeVariants[0].price);

        const productCard = document.createElement("article");
        productCard.classList.add("product-card");

        productCard.innerHTML = `
            <div class="product-image">
                ${
                    product.image_url
                        ? `<img
                src="${product.image_url}"
                alt="${product.name}"
                width="1200"
                height="900"
                loading="lazy"
                decoding="async"
>`
                        : `<div class="product-image-placeholder">
                            🐾
                        </div>`
                }
            </div>

            <div class="product-info">

                <p class="product-label">
                    MADE FRESH TO ORDER
                </p>

                <h3>${product.name}</h3>

                <p class="product-description">
                    ${product.description}
                </p>

                <p class="product-price">
                    From $${startingPrice.toFixed(2)}
                </p>

                <a
                    href="product.html?product=${product.slug}"
                    class="product-button"
                >
                    View Treat
                </a>

            </div>
        `;

        productGrid.appendChild(productCard);
    });
}


loadProducts();