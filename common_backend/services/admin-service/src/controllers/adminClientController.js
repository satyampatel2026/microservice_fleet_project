const axios = require("axios");

const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:5001";

const getClients = async (req, res) => {
  try {
    const response = await axios.get(`${CLIENT_SERVICE_URL}/internal/clients`, {
      params: {
        search: req.query.search || "",
        status: req.query.status || "",
        sort: req.query.sort || "",
        businessStatus: req.query.businessStatus || "",
        vehicleApproval: req.query.vehicleApproval || "",
        page: req.query.page || 1,
        limit: req.query.limit || 10,
      },
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 5000,
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Admin clients error:", error.message);
    return res.status(error.response?.status || 503).json({
      success: false,
      message: error.response?.data?.message || "Client Service is unavailable",
    });
  }
};

const getClientDetails = async (req, res) => {
  const clientId = Number(req.params.clientId);
  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid client ID" });
  }
  try {
    const response = await axios.get(`${CLIENT_SERVICE_URL}/internal/clients/${clientId}/details`, {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 5000,
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Admin client details error:", error.message);
    return res.status(error.response?.status || 503).json({
      success: false,
      message: error.response?.data?.message || "Client Service is unavailable",
    });
  }
};

const updateClientStatus = async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { status } = req.body || {};

  if (!Number.isSafeInteger(clientId) || clientId <= 0 || !["active", "inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "Valid client ID and status are required" });
  }

  if (!process.env.INTERNAL_SERVICE_KEY) {
    return res.status(500).json({ success: false, message: "Internal service key is not configured" });
  }

  const options = {
    headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
    timeout: 5000,
  };

  try {
    // Profile ki ID aur email verify karke same login account update karna hai.
    const profileResponse = await axios.get(
      `${CLIENT_SERVICE_URL}/internal/clients/${clientId}/profile`, options
    );
    const profile = profileResponse.data?.data;
    if (profileResponse.data?.success !== true || profile?.client_id !== clientId || !profile?.email) {
      throw new Error("Client profile verification failed");
    }

    const body = { status, email: profile.email };
    let firstResponse;
    let secondResponse;

    if (status === "inactive") {
      // Pehle login block karo; uske baad profile ka status badlo.
      firstResponse = await axios.patch(`${AUTH_SERVICE_URL}/internal/auth/client-accounts/${clientId}/status`, body, options);
      if (firstResponse.data?.success !== true) throw new Error("Auth status update failed");
      secondResponse = await axios.patch(`${CLIENT_SERVICE_URL}/internal/clients/${clientId}/status`, body, options);
    } else {
      // Login tabhi allow hoga jab profile pehle active ho chuki ho.
      firstResponse = await axios.patch(`${CLIENT_SERVICE_URL}/internal/clients/${clientId}/status`, body, options);
      if (firstResponse.data?.success !== true) throw new Error("Profile status update failed");
      secondResponse = await axios.patch(`${AUTH_SERVICE_URL}/internal/auth/client-accounts/${clientId}/status`, body, options);
    }

    if (secondResponse.data?.success !== true) throw new Error("Status synchronization failed");

    return res.status(200).json({
      success: true,
      message: status === "active" ? "Client activated successfully" : "Client deactivated successfully",
    });
  } catch (error) {
    console.error("Client status update error:", error.message);
    // Ek update complete hua ho sakta hai. Same target status se retry safe hai.
    return res.status(502).json({
      success: false,
      message: "Status update could not be confirmed in both services. It may be partially applied. Refresh and retry the same status.",
    });
  }
};

module.exports = { getClients, getClientDetails, updateClientStatus };
