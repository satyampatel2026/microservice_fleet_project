const requireAdminRole = (req, res, next) => {
  const role = req.userRole;

  if (!["Admin", "SUPER ADMIN"].includes(role)) {
    return res.status(403).json({
      success: false,
      message: "Only Admin can manage users",
    });
  }

  next();
};

module.exports = requireAdminRole;