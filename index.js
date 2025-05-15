import express from "express"
const app = express()

app.get("/", async(req, res)=>{
    return res.status(200).json({success: true, message: "My name is Subhajit Mondal"})
})

app.listen(3000, ()=>{
    console.log(`Server running at port 3000`)
})