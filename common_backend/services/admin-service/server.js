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

const app = express();

const PORT = process.env.SERVER_PORT || 5002;


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

app.use("/", userRouter);
app.use("/", departmentRouter);
app.use("/", roleRouter);
app.use("/", dashboardRouter);
app.use("/", internalAuthRouter);
app.use("/", categoryRouter);
app.use("/", serviceRouter);
app.use("/", internalCatalogRouter);


// ================= HEALTH CHECK =================

app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    service: "admin-service",
    message: "Admin service is running",
  });
});


// ================= SERVER =================

app.listen(PORT, () => {
  console.log(
    `Admin service is running on port ${PORT}`
  );
});