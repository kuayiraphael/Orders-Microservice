const ShoppingService = require("../services/shopping-service");
const { PublishCustomerEvent, SubscribeMessage } = require("../utils");
const auth = require("./middlewares/auth");
const { PublishMessage } = require("../utils");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

shoppingRoutes = (app, channel) => {
  const service = new ShoppingService();

  SubscribeMessage(channel, service);
  app.get("/", (req, res) => {
    res.send("home");
  });

  app.post("/order", auth, async (req, res, next) => {
    const { _id } = req.user;

    const { data } = await service.PlaceOrder({ _id });

    const payload = await service.GetOrderPayload(_id, data, "CREATE_ORDER");
    const notificationPayload = await service.GetNotificationPayload(
      req.user.email,
      data,
      "SEND_CHECKOUT_CONFIRMATION_MAIL"
    );

    PublishMessage(
      channel,
      process.env.CUSTOMER_BINDING_KEY,
      JSON.stringify(payload)
    );
    PublishMessage(
      channel,
      process.env.NOTIFICATION_BINDING_KEY,
      JSON.stringify(notificationPayload)
    );

    res.status(200).json(data);
  });

  app.get("/orders", auth, async (req, res, next) => {
    const { _id } = req.user;

    const { data } = await service.GetOrders(_id);

    res.status(200).json(data);
  });

  app.put("/cart", auth, async (req, res, next) => {
    const { _id } = req.user;
    const { item, quantity, isRemove } = req.body;

    const { data } = await service.ManageCart(_id, item, quantity, isRemove);

    res.status(200).json(data);
  });

  app.delete("/cart/:id", auth, async (req, res, next) => {
    const { _id } = req.user;

    const { data } = await service.ManageCart(_id, [], 0, true);

    res.status(200).json(data);
  });

  app.get("/cart", auth, async (req, res, next) => {
    const { _id } = req.user;

    const { data } = await service.GetCart({ _id });

    return res.status(200).json(data);
  });

  app.get("/whoami", (req, res, next) => {
    return res.status(200).json({ msg: "/shoping : I am Shopping Service" });
  });
  app.post("/payment-sheet", auth, async (req, res, next) => {
    try {
      const { amount, currency = "usd" } = req.body;
      if (!amount || typeof amount !== "number") {
        return res
          .status(400)
          .json({ error: "Amount is required and must be a number." });
      }

      // For a real-world scenario, you may want to check if the user already has a Stripe customer ID
      // associated with their account instead of always creating a new one.
      const customer = await stripe.customers.create();

      // Create an ephemeral key for the customer.
      const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customer.id },
        { apiVersion: "2025-01-27.acacia" }
      );

      // Create the PaymentIntent with the provided amount and currency.
      const paymentIntent = await stripe.paymentIntents.create({
        amount, // Amount should be provided in the smallest currency unit (e.g., cents for USD)
        currency,
        customer: customer.id,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Return the necessary details to the client.
      res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customer.id,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      });
    } catch (error) {
      console.error("Error creating payment sheet:", error);
      res.status(500).json({ error: error.message });
    }
  });
};
module.exports = shoppingRoutes;
