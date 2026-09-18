const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, "../.env")
});

const productsRouter = require("./routes/products");

const cartRouter = require("./routes/cart");
const app = express();
const PORT = process.env.PORT || 3000;
const couponsRouter = require("./routes/coupons");
const checkoutRouter = require("./routes/checkout");
const webhookRouter = require("./routes/webhook");
const orderConfirmationRouter =
    require("./routes/order-confirmation");
const ordersRouter = require("./routes/orders");
const contactRouter = require("./routes/contact");
// Middleware
// Middleware
app.use(cors());

app.use(
    "/api/webhook",
    express.raw({
        type: "application/json"
    }),
    webhookRouter
);

app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/checkout", checkoutRouter);

app.use(
    "/api/order-confirmation",
    orderConfirmationRouter
);

app.use(
    "/api/orders",
    ordersRouter
);

app.use(
    "/api/contact",
    contactRouter
);
// Serve the frontend from /public
app.use(express.static(path.join(__dirname, "../public")));

// Test route
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "The Barkery House backend is running!"
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🐶 The Barkery House server is running on port ${PORT}`);
});