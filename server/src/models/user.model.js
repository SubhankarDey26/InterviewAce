const mongoose=require("mongoose")

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        unique:[true,"Username Alreay Exist"],
        required:[true,"Username is Required"]
    },
    email:{
        type:String,
        unique:[true,"Email already Exist"],
        required:[true,"Email is required"]
    },
    password:{
        type:String,
        required:[true,"Password is required"]
    }
})

const userModel=mongoose.model('users',userSchema)

module.exports=userModel