require("dotenv").config();
const cookieParser = require("cookie-parser");
const express = require("express");
const internalClientRouter = require("./src/routes/internalClientRoute");
const clientProfileRouter = require("./src/routes/clientProfileRoute");
const clientTerms = require("./src/config/clientTerms");
const clientVehicleRouter = require("./src/routes/clientVehicleRoute");
const clientDriverRouter = require("./src/routes/clientDriverRoute");
const clientTripRouter = require("./src/routes/clientTripRoute");
const clientServiceRequestRouter =require("./src/routes/clientServiceRequestRoute");

const app = express();

app.use(express.json());
app.use(cookieParser());


app.get("/api/client/terms", (req, res) => {
  if (!clientTerms.content?.trim()) {
    return res.status(503).json({
      success: false,
      message: "Terms and Conditions are not configured",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      version: clientTerms.version,
      content: clientTerms.content,
    },
  });
});


app.use("/",internalClientRouter);
app.use("/", clientProfileRouter);
app.use("/",clientVehicleRouter);
app.use("/", clientDriverRouter);
app.use("/",clientTripRouter);
app.use("/",clientServiceRequestRouter );

const PORT = process.env.SERVER_PORT || 5004;

app.listen(PORT, () => {
  console.log(`Client Service running on port ${PORT}`);
});