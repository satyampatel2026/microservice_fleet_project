require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const adminAuthRouter = require("./src/routes/adminAuthRoute");
const partnerAuthRouter = require("./src/routes/partnerAuthRoute");
const internalAdminAccountRouter = require("./src/routes/internalAdminAccountRoute");
const clientAuthRouter = require("./src/routes/clientAuthRoute");
const internalClientAccountRouter = require("./src/routes/internalClientAccountRoute");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.SERVER_PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175"
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", adminAuthRouter);
app.use("/", partnerAuthRouter);
app.use("/", internalAdminAccountRouter);
app.use("/", clientAuthRouter);
app.use("/", internalClientAccountRouter);


app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});