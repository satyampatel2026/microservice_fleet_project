const db=require('../model/db');

const createEmployee=async(req,res)=>{
 const partnerId=req.partnerId;
 const {name,mobile,role}=req.body;
 if(typeof name !== "string" ||
    !name.trim() || name.trim().length>100 ||
    typeof mobile !=="string" ||
    !/^[0-9]{10}$/.test(mobile)||
    typeof role !== "string" ||
    !role.trim() || role.trim().length>50){
        return res.status(400).json({
            success:false,
            message:"valid name, 10-digit mobile and role are required"
        });
    }
    try{
         console.log(partnerId,name,mobile,role);
      const [result]=await db.query(`insert into partner_employees(partner_id,name,mobile,role) values(?, ?, ?, ?)`,[partnerId, name.trim(),mobile,role.trim()] );
      return res.status(201).json({
        success:true,
        message:"employee added successfully",
        employee_id:result.insertId
      });
    }catch(error){
        if(error.code==="ER_DUP_ENTRY"){
         return res.status(409).json({
            success:false,
            message:"this details already registered in our records"
         })
        }
        console.log("add employee error",error.message);
        return res.status(500).json({
            success:false,
            message:"failed to add employee"
        })
    }
}

const getEmployees=async(req,res)=>{
    const partnerId=req.partnerId;
    try{
     const [employees]=await db.query(`select employee_id,name,mobile,role,status from partner_employees where partner_id=?`, [partnerId]);
     return res.status(200).json({
        success:true,
        data:employees,
     })
    }catch(error){
      console.log("get employees error",error.message)
      return res.status(500).json({
        success:false,
        message:"Failed to fetch employees"
      });
    }
}

const updateEmployee= async(req,res)=>{
    const partnerId=req.partnerId;
    const employeeId=Number(req.params.employeeId);
    const {name,mobile,role}=req.body;
    if(typeof name !=="string" || !name.trim() || !name.trim().length>100 ||
     typeof mobile !=="string" || !/^[0-9]{10}$/.test(mobile) ||
    typeof role !== "string" || !role.trim() || role.trim().length>50){
        return res.status(400).json({
            success:false,
            message:"valid name,10-digit mobile no. and role are required"
        })
    }
    try{
        const [employees]=await db.query(`select employee_id from partner_employees where employee_id=? and partner_id=?`,[employeeId,partnerId]);
        if(employees.length===0){
            return res.status(404).json({
                success:false,
                message:"employee not found"
            });
        }
     await db.query(`update partner_employees set name=?, mobile=?, role=? where employee_id=? and partner_id=?`,[name.trim(), mobile, role, employeeId, partnerId]);
     return res.status(200).json({
        success:true,
        message:"employee update successfully"
     });
    }catch(error){
       if(error.code==="ER_DUP_ENTRY"){
        return res.status(409).json({
            success:false,
            message:"this details already registered in our record"
        });
       }
       console.log("update employee error",error.message)
       return res.status(500).json({
        success:false,
        message:"failed to update employee"
       });
    }
}

const updateEmployeeStatus=async(req,res)=>{
    const partnerId=5;
    const employeeId=Number(req.params.employeeId);
    const {status}=req.body;
    if (!["active", "inactive"].includes(status)){
        return res.status(400).json({
            success:false,
            message:"status must be active or inactive",
        })
    }
    try{
        const [employees]=await db.query(`select employee_id from partner_employees where employee_id=? and partner_id=?`,[employeeId,partnerId]);
        if(employees.length===0){
            return res.status(404).json({
                success:false,
                message:"employee not found"
            });
        }
         await db.query(`update partner_employees set status=? where employee_id=? and partner_id=?`,[status,employeeId,partnerId]);
         return res.status(200).json({
            success:true,
            message:"employee status update successfully"
         })
    }catch(error){
        console.log("update employee status",error.message);
        return res.status(500).json({
            success:false,
            message:"failed to update employee status"
        })
    }
}

module.exports={createEmployee,getEmployees,updateEmployee,updateEmployeeStatus};