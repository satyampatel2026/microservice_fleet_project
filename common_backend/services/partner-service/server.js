require("dotenv").config();
const { startConsumer, stopConsumer } = require("./src/config/kafka");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const partnerKycRouter = require(
  "./src/routes/partnerKycRoute"
);

const adminPartnerRouter = require(
  "./src/routes/adminPartnerRoute"
);

const adminKycRouter = require(
  "./src/routes/adminKycRoute"
);
const internalPartnerRouter = require(
  "./src/routes/internalPartnerRoute"
);
const partnerServicesRouter = require(
  "./src/routes/partnerServicesRoute"
);
const partnerEmployeeRouter = require("./src/routes/partnerEmployeeRoute");

const app = express();

const PORT = process.env.SERVER_PORT || 5003;


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

// Partner KYC
app.use("/", partnerKycRouter);

// Admin Partner Management
app.use("/", adminPartnerRouter);

// Admin KYC Management
app.use("/", adminKycRouter);

// Internal Service Communication
app.use("/", internalPartnerRouter);
app.use("/", partnerServicesRouter);
app.use("/",partnerEmployeeRouter);

// ================= HEALTH CHECK =================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "partner-service",
    message: "Partner service is running",
  }); 
});
// ================= SERVER =================

const server = app.listen(PORT, () => {
  console.log(`Partner service is running on port ${PORT}`);
});

let consumerStarted = false;

const consumerStartupPromise = startConsumer()
  .then(() => {
    consumerStarted = true;
  })
  .catch((error) => {
    console.error("Kafka consumer startup failed:", error.message);
  });

// ================= GRACEFUL SHUTDOWN =================

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Shutting down Partner Service...`);

  try {
    // Stop accepting new HTTP connections
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    // Disconnect Kafka consumer
    // Wait for Kafka consumer startup to settle
await consumerStartupPromise;

// Disconnect Kafka consumer if started successfully
if (consumerStarted) {
  await stopConsumer();
  console.log("Partner Service Kafka consumer stopped");
}

    console.log("Partner Service shut down successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Partner Service shutdown failed:", error.message);
    process.exit(1);
  }
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));