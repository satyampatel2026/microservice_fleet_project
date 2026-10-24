const express=require('express');
const partnerEmployeeRouter=express.Router();
const {createEmployee,getEmployees,updateEmployee,updateEmployeeStatus}=require('../controllers/partnerEmployeeController');
const partnerAuthMiddleware =require('../middlewares/partnerAuthMiddleware');

partnerEmployeeRouter.post("/api/partners/me/employees",partnerAuthMiddleware,createEmployee);
partnerEmployeeRouter.get("/api/partners/me/employees", partnerAuthMiddleware,getEmployees);
partnerEmployeeRouter.put("/api/partners/me/employees/:employeeId", partnerAuthMiddleware,updateEmployee);
partnerEmployeeRouter.patch("/api/partners/me/employees/:employeeId/status",partnerAuthMiddleware,updateEmployeeStatus);

module.exports=partnerEmployeeRouter;