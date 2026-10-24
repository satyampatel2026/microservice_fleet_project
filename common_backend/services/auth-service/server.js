require("dotenv").config();
const { startOutboxWorker } = require("./src/workers/outboxWorker");
const { disconnectProducer } = require("./src/config/kafka");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const adminAuthRouter = require("./src/routes/adminAuthRoute");
const partnerAuthRouter = require("./src/routes/partnerAuthRoute");
const internalAdminAccountRouter = require("./src/routes/internalAdminAccountRoute");
const clientAuthrouter=require('./src/routes/clientAuthRoute');
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
app.use("/",clientAuthrouter);

// ================= HEALTH CHECK =================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "auth-service",
    message: "Auth service is running",
  });
});


// ================= SERVER =================

const server = app.listen(PORT, () => {
  console.log(`Auth service is running on port ${PORT}`);
});
const stopOutboxWorker = startOutboxWorker();

console.log("Auth Service Kafka Outbox Worker started");

// ================= GRACEFUL SHUTDOWN =================

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down Auth Service...`);

  try {
    // Stop accepting new HTTP connections
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Wait for current Kafka event processing to finish
    await stopOutboxWorker();

    // Disconnect Kafka producer
    await disconnectProducer();

    console.log("Auth Service shut down successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Auth Service shutdown failed:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));