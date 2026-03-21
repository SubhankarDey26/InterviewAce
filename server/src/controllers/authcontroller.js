const userModel=require("../models/user.model")

const jwt=require("jsonwebtoken")
const bcrypt=require("bcrypt")


async function registerController(req,res) {
    const {username,email,password}=req.body

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

    const hash =bcrypt.hash(password,10)


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



async function loginController(req,res)
{
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

    if(!user)
    {
        return res.json(404).json({
            Message:"User Not Found"
        })
    }

    const isPasswordValid=await bcrypt.compare(password,user.password)

    if(!isPasswordValid)
    {
        return res.status(401).json({
            message:"Password Invalid"
        })
    }

    const token=jwt.sign(
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
            bio:user.bio,
            profileImage:user.profileImage
        }
    })
}


module.exports={
    registerController,
    loginController
}