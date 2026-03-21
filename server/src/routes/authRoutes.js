const express=require("express")
const authController=require("../controllers/authcontroller")


const authRouter=express.Router()


authRouter.post("/register",authController.registerController)
authRouter.post("/login",authController.loginController)


module.exports=authRouter