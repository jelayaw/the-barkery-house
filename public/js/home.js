/* ========================================
   MOBILE NAVIGATION
======================================== */

const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

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
   FEATURED PRODUCTS
======================================== */

const featuredProducts =
    document.getElementById("featured-products");


async function loadFeaturedProducts() {

    if (!featuredProducts) {
    return;
}

    try {

        const response =
            await fetch("/api/products");

        const data =
            await response.json();


        if (!response.ok || !data.success) {
            throw new Error(
                "Unable to load featured products."
            );
        }


        /*
         * For now, use the first three active
         * products returned by our backend.
         */

        const products =
            data.products.slice(0, 3);


        displayFeaturedProducts(products);


    } catch (error) {

        console.error(
            "Featured products error:",
            error.message
        );


        featuredProducts.innerHTML = `
            <p>
                Sorry! We couldn't load our
                pup favorites right now.
            </p>
        `;

    }

}


function displayFeaturedProducts(products) {

    featuredProducts.innerHTML = "";


    products.forEach((product) => {


        const activeVariants =
            product.product_variants
                .filter((variant) => variant.active)
                .sort(
                    (a, b) =>
                        Number(a.price) -
                        Number(b.price)
                );


        if (activeVariants.length === 0) {
            return;
        }


        const startingPrice =
            Number(activeVariants[0].price);


        const card =
            document.createElement("article");


        card.classList.add("featured-card");


        card.innerHTML = `

            <div class="featured-image">

                <img
                    src="${product.image_url}"
                    alt="${product.name}"
                    width="1200"
                    height="900"
                    loading="lazy"
                    decoding="async"
                >

            </div>


            <div class="featured-info">

                <p class="featured-label">
                    MADE FRESH TO ORDER
                </p>

                <h3>
                    ${product.name}
                </h3>

                <p class="featured-price">
                    From $${startingPrice.toFixed(2)}
                </p>

                <a
                    href="product.html?product=${product.slug}"
                    class="featured-button"
                >
                    View Treat
                    <span aria-hidden="true">→</span>
                </a>

            </div>

        `;


        featuredProducts.appendChild(card);

    });

}


loadFeaturedProducts();
document.addEventListener(
    "click",
    (event) => {

        if (
            navLinks &&
            menuToggle &&
            navLinks.classList.contains("active") &&
            !navLinks.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {

            navLinks.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            menuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

        }

    }
);
const newsletterForm =
    document.querySelector("#newsletter-form");

const newsletterStatus =
    document.querySelector("#newsletter-status");

if (newsletterForm && newsletterStatus) {
    newsletterForm.addEventListener(
        "submit",
        (event) => {
            event.preventDefault();

            newsletterStatus.textContent =
                "Welcome to the pack! 🐾";

            newsletterForm.reset();
        }
    );
}