require("dotenv").config();
const { startOutboxWorker,} = require("./src/workers/outboxWorker");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const adminAuthRouter = require("./src/routes/adminAuthRoute");
const partnerAuthRouter = require("./src/routes/partnerAuthRoute");
const internalAdminAccountRouter = require(
  "./src/routes/internalAdminAccountRoute"
);
const app = express();

const PORT = process.env.SERVER_PORT || 5001;


// ================= MIDDLEWARES =================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());


// ================= ROUTES =================

app.use("/", adminAuthRouter);

app.use("/", partnerAuthRouter);
app.use("/", internalAdminAccountRouter);


// ================= HEALTH CHECK =================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "auth-service",
    message: "Auth service is running",
  });
});


// ================= SERVER =================

app.listen(PORT, () => {
  console.log(
    `Auth service is running on port ${PORT}`
  );
});
const stopOutboxWorker = startOutboxWorker();

console.log("Auth Service Kafka Outbox Worker started");