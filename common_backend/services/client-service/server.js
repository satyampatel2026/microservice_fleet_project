require("dotenv").config();

const express = require("express");
const db = require("./src/model/db");
const internalClientRouter = require("./src/routes/internalClientRoute");
const app = express();

app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    await db.query("SELECT 1");

    return res.status(200).json({
      success: true,
      service: "client-service",
      message: "Client Service and database are running",
    });
  } catch (error) {
    console.error("Client database error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Client database connection failed",
    });
  }
});

app.use('/',internalClientRouter)

const PORT = process.env.SERVER_PORT || 5004;

app.listen(PORT, () => {
  console.log(`Client Service running on port ${PORT}`);
});