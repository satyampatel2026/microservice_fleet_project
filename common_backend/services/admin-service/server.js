require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const userRouter = require("./src/routes/userRoute");
const departmentRouter = require("./src/routes/departmentRoute");
const roleRouter = require("./src/routes/roleRoute");
const dashboardRouter = require("./src/routes/dashboardRoute");
const internalAuthRouter = require("./src/routes/internalAuthRoute");
const categoryRouter = require("./src/routes/categoryRoute");
const serviceRouter = require("./src/routes/serviceRoute");
const internalCatalogRouter = require("./src/routes/internalCatalogRoute");
const adminClientRouter = require("./src/routes/adminClientRoute");
const adminProfileRouter = require("./src/routes/adminProfileRoute");
const adminVehicleBusinessRouter = require("./src/routes/adminVehicleBusinessRoute");
const app = express();
const PORT = process.env.SERVER_PORT || 5002;

// ================= MIDDLEWARES =================

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ================= ROUTES =================

app.use("/", userRouter);
app.use("/", departmentRouter);
app.use("/", roleRouter);
app.use("/", dashboardRouter);
app.use("/", internalAuthRouter);
app.use("/", categoryRouter);
app.use("/", serviceRouter);
app.use("/", internalCatalogRouter);
app.use("/", adminClientRouter);
app.use("/", adminVehicleBusinessRouter);
app.use("/", adminProfileRouter);

// ================= SERVER =================

app.listen(PORT, () => {
  console.log(`Admin service is running on port ${PORT}`);
});
