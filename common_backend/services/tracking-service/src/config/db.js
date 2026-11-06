const mongoose=require('mongoose');

const connectDB=async()=>{
    await mongoose.connect(process.env.MONGODB_URI,{
        serverSelectionTimeoutMS:5000
    });
    console.log("Tracking service MongoDB Connected");
}

module.exports=connectDB;