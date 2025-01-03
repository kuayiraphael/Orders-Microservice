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

require("dotenv").config();
app.use(express.urlencoded({ extended: true }));

(async function startApp() {
  try {
    await mongoose.connect(process.env.DB_URI);
    print("Connected to  Order DB");

    const channel = await CreateChannel();

    shoppingRoutes(app, channel);
    // appEvents(app);
    app.listen(8003, () => {
      console.log("Customer is Listening to Port 8003");
    });
  } catch (err) {
    console.log("Failed to start app:", err);
  }
})();

module.exports = app;
