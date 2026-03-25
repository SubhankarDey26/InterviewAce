const express=require("express")
const cors=require("cors")
const cookieParser=require("cookie-parser")
const authRouter=require("./routes/authRoutes")
const contactRouter=require("./routes/contactRoutes")
const interviewRouter=require("./routes/interviewRoutes")
const app=express()

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api/auth",authRouter)
app.use("/api/contact",contactRouter)
app.use("/api/interview", interviewRouter)
module.exports=app