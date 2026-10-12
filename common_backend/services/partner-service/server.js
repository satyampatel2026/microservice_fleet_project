require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

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


// ================= KYC FILES =================

// Uploaded PAN / Aadhaar / GST documents
app.use(
  "/myfiles",
  express.static(
    path.join(__dirname, "myfiles")
  )
);


// ================= ROUTES =================

// Partner KYC
app.use("/", partnerKycRouter);

// Admin Partner Management
app.use("/", adminPartnerRouter);

// Admin KYC Management
app.use("/", adminKycRouter);

// Internal Service Communication
app.use("/", internalPartnerRouter);


// ================= HEALTH CHECK =================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "partner-service",
    message: "Partner service is running",
  });
});


// ================= SERVER =================

app.listen(PORT, () => {
  console.log(
    `Partner service is running on port ${PORT}`
  );
});