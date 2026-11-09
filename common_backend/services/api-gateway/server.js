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

const proxyTo = (target) =>
  createProxyMiddleware({
    target,
    xfwd: true, // Append the real client IP for the Auth Service rate limiter.
    changeOrigin: true,
    // Preserve the original /api/... path
    pathRewrite: (path, req) => req.originalUrl,
  });

// ===============================
// AUTH SERVICE - PORT 5001
// ===============================

app.use(
  [
    // Admin authentication
    "/api/admin/login",
    "/api/admin/logout",
    "/api/admin/auth",

    // Partner authentication
    "/api/partner/login",
    "/api/partner/logout",
    "/api/partner/register",
    "/api/partner/forgot-password",
    "/api/partner/verify-otp",
    "/api/partner/reset-password",
    "/api/partner/auth",

    // Client authentication
    "/api/client/register",
    "/api/client/login",
    "/api/client/logout",
    "/api/client/auth",
    "/api/client/forgot-password",
    "/api/client/verify-otp",
    "/api/client/reset-password",
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
    "/api/partners/me",
    "/api/partner/profile",
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
    "/api/admin/clients",
    "/api/admin/profile",
    "/api/admin/verification",
  ],
  proxyTo(process.env.USER_SERVICE_URL)
);

// ===============================
// TRACKING SERVICE - PORT 5005
// ===============================
app.use(
  [
    "/api/tracking",
    "/api/client/vehicles/:vehicleId/tracking-link",
  ],
  proxyTo(process.env.TRACKING_SERVICE_URL || "http://localhost:5005")
);
// ===============================
// CLIENT SERVICE - PORT 5004
// ===============================

app.use(
  ["/api/client/terms",
  "/api/client/profile",
 "/api/client/vehicles",
 "/api/client/drivers",
 "/api/client/trips",
 "/api/client/service-requests",
],
  proxyTo(process.env.CLIENT_SERVICE_URL)
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
