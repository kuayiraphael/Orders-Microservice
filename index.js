const express = require("express");
const app = express();
const mongoose = require("mongoose");
const print = console.log;
const cors = require("cors");
const appEvents = require("./api/app-events");
const shoppingRoutes = require("./api/shopping");
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname + "/public"));

const { CreateChannel, SubscribeMessage } = require("./utils");
const port = process.env.PORT || 8002;
require("dotenv").config();
app.use(express.urlencoded({ extended: true }));

async function startApp() {
  try {
    await mongoose.connect(process.env.DB_URI);
    print("Connected to  Order DB");

    const channel = await CreateChannel();

    shoppingRoutes(app, channel);
   app.listen(port, () => {
      console.log("Product Service is Listening to Port ${port}");
    }); // Pass Redis client to routes

    app.get("/health", (req, res) => {
      res.send("Order Service Running");
    });
  } catch (err) {
    console.log("Failed to start app:", err);
  }
}
startApp();
