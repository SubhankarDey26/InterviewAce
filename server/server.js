require("dotenv").config()
const app=require("./src/app")
const connectToDb=require("../server/src/config/db")


connectToDb()

app.listen(3000,()=>{
    console.log("Server is Running on the PORT 3000")
})