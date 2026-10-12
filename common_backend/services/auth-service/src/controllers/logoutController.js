const logoutUser = (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const logoutPartner = (req, res) => {
  res.clearCookie("partner_token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

module.exports = {
  logoutUser,
  logoutPartner,
};