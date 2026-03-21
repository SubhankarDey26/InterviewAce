const userModel=require("../models/user.model")

const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")


async function registerController(req,res){
    const {email,username,password}=req.body


    const isUserAlreadyExist=await userModel.findOne({
        $or:[
            {username},
            {email}
        ]
    })

    if(isUserAlreadyExist)
    {
        return res.status(409).json({
            message:"User Already Exist"
        })
    }

      const hash = await bcrypt.hash(password, 10)
    
    const user =await userModel.create({
        username,
        email,
        password:hash
    })

    const token=jwt.sign({
        id:user._id,
    },process.env.JWT_SECRET,{expiresIn:"1d"})

    res.cookie("token",token)


    res.status(201).json({
        message:"User Registered Succesfully",
        user:{
            email:user.email,
            username:user.username
        }
    })

}


async function loginController(req,res){
    const {username,email,password}=req.body

    const user=await userModel.findOne({
        $or:[
            {
               username:username
            },
            {
                email:email
            }
        ]
    })

    if(!user){
        return res.status(404).json({
            message:"User Not Found"
        })
    }

    const ispasswordValid=await bcrypt.compare(password,user.password)

    if(!ispasswordValid)
    {
        return res.status(401).json({
            message:"Password Invalid"
        })
    }
    const token =jwt.sign(
        {id:user._id},
        process.env.JWT_SECRET,
        {expiresIn:"1d"}
    )

    res.cookie("token",token)


    res.status(200).json({
        message:"User LogedIn Succesfully",
        user:{
            username:user.username,
            email:user.email,
        }
    })
}


module.exports={
    registerController,
    loginController
}