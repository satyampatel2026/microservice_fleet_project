require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const partnerKycRouter = require("./src/routes/partnerKycRoute");
const adminPartnerRouter = require("./src/routes/adminPartnerRoute");
const adminKycRouter = require("./src/routes/adminKycRoute");
const internalPartnerRouter = require("./src/routes/internalPartnerRoute");
const partnerServicesRouter = require("./src/routes/partnerServicesRoute");
const partnerEmployeeRouter = require("./src/routes/partnerEmployeeRoute");
const partnerProfileRouter = require("./src/routes/partnerProfileRoute");
const app = express();

const PORT = process.env.SERVER_PORT || 5003;

// Middlewares
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

// Routes
app.use("/", partnerKycRouter);
app.use("/", adminPartnerRouter);
app.use("/", adminKycRouter);
app.use("/", internalPartnerRouter);
app.use("/", partnerServicesRouter);
app.use("/", partnerEmployeeRouter);
app.use("/", partnerProfileRouter);

app.listen(PORT, () => {
  console.log(`Partner service is running on port ${PORT}`);
});