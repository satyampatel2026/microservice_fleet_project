// Middleware pass hua, matlab client logged in hai
const checkClientAuth = (req, res) => {
  return res.status(200).json({
    success: true,
    client: {
      id: req.clientId,
      email: req.clientEmail,
    },
  });
};

// Browser se login cookie hatao
const logoutClient = (req, res) => {
  res.clearCookie("client_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Client logged out successfully",
  });
};

module.exports = {
  checkClientAuth,
  logoutClient,
};