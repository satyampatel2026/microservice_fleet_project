require("dotenv").config();

const express = require("express");
const db = require("./src/model/db");
const cookieParser = require("cookie-parser");
const paymentOrderRouter = require("./src/routes/paymentOrderRoute");

const app = express();
const port = process.env.SERVER_PORT;

app.use(express.json());
app.use(cookieParser());

app.use(paymentOrderRouter);

app.listen(port, () => {
  console.log(`Payment service running on port ${port}`);
});