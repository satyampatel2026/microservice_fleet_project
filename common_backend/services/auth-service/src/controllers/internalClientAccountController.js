const authDb = require("../model/authDb");

// Internal key middleware ke baad hi is controller ko call karna hai.
const updateClientAccountStatus = async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { status, email } = req.body || {};

  if (!Number.isSafeInteger(clientId) || clientId <= 0 ||
      !["active", "inactive"].includes(status) ||
      typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ success: false, message: "Invalid client status details" });
  }

  try {
    const [accounts] = await authDb.query(
      "SELECT auth_id FROM client_accounts WHERE client_id = ? AND email = ? LIMIT 1",
      [clientId, email.trim().toLowerCase()]
    );
    if (accounts.length === 0) {
      return res.status(404).json({ success: false, message: "Client login account not found" });
    }

    // Same status dobara bhejne par bhi success: partial failure retry ke liye.
    await authDb.query("UPDATE client_accounts SET status = ? WHERE auth_id = ?", [status, accounts[0].auth_id]);
    return res.status(200).json({ success: true, message: "Client login status updated" });
  } catch (error) {
    console.error("Client login status error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update client login status" });
  }
};

module.exports = { updateClientAccountStatus };
