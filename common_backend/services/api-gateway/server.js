require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
  ],
  credentials: true,
}));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "api-gateway",
    message: "API Gateway is running",
  });
});

const proxyTo = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    // Preserve the original /api/... path
    pathRewrite: (path, req) => req.originalUrl,
  });

// ===============================
// AUTH SERVICE - PORT 5001
// ===============================

app.use(
  [
    "/api/admin/login",
    "/api/admin/logout",
    "/api/admin/auth",
    "/api/partner/login",
    "/api/partner/logout",
    "/api/partner/register",
    "/api/partner/forgot-password",
    "/api/partner/verify-otp",
    "/api/partner/reset-password",
    "/api/partner/auth",
  ],
  proxyTo(process.env.AUTH_SERVICE_URL)
);

// ===============================
// PARTNER SERVICE - PORT 5003
// Admin Partner Management + KYC
// ===============================

app.use(
  [
    "/api/admin/partners",
    "/api/admin/kyc",
    "/api/partner/kyc",
    "/api/partner/my-services",
    "/api/partners/me"
  ],
  proxyTo(process.env.PARTNER_SERVICE_URL)
);

// ===============================
// ADMIN SERVICE - PORT 5002
// ===============================

app.use(
  [
    "/api/admin/users",
    "/api/admin/departments",
    "/api/admin/roles",
    "/api/admin/user-roles",
    "/api/admin/dashboard",
    "/api/admin/categories",
    "/api/admin/services",
    "/api/partner/service-catalog",
  ],
  proxyTo(process.env.USER_SERVICE_URL)
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
