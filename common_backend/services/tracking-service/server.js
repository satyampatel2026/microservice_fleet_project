require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const connectDB=require('./src/config/db');
const cookieParser = require("cookie-parser");
const trackingRouter = require( "./src/routes/trackingRoute");
const app=express();

app.use(express.json({limit:"20kb"}));
app.use(cookieParser());

app.use("/",trackingRouter);
app.get("/health",(req,res)=>{
    const connected=mongoose.connection.readyState===1;
   return res.status(connected? 200:503).json({
    success:connected,
    service:"tracking service",
    database: connected? "connected":"disconnected"
   });
})

const PORT=process.env.SERVICE_PORT || 5005;

const startServer=async()=>{
    try{
    await connectDB();
    app.listen(PORT,()=>{
        console.log(`TRACKING SERVICE RUNNING ON PORT ${PORT}`);
    });
    }catch(error){
      console.log("TRACKING SERVICE STARTUP FAILED",error.message);
      process.exit(1);
    }
}

startServer();