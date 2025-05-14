import express from "express"
const app = express()

app.get("/", async(req, res)=>{
    return res.status(200).json({success: true, message: "Node app running"})
})

app.listen(3000, ()=>{
    console.log(`Server running at port 3000`)
})