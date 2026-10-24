const express = require("express");

const departmentRouter = express.Router();

const {
  getDept,
  postDept,
  updateDept,
  deleteDept,
} = require("../controllers/departmentController");

const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);
const requireAdminRole = require("../middlewares/requireAdminRole");

// Get all departments
departmentRouter.get(
  "/api/admin/departments",adminAuthMiddleware,
  getDept
);


// Add department
departmentRouter.post(
  "/api/admin/departments",adminAuthMiddleware,requireAdminRole ,
  postDept
);


// Update department
departmentRouter.put(
  "/api/admin/departments",adminAuthMiddleware,requireAdminRole ,
  updateDept
);


// Delete department
departmentRouter.delete(
  "/api/admin/departments",adminAuthMiddleware,requireAdminRole ,
  deleteDept
);


module.exports = departmentRouter;