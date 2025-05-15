import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import mongoose from "mongoose";
import User from "./model.js";
import cors from "cors";

const connect = async () => {
  await mongoose
    .connect(process.env.URL)
    .then((res) => console.log("mongodb connected"))
    .catch((err) => console.log("error connection", err));
};

connect();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://13.60.85.176",
    credentials: true,
  })
);

app.get("/user", async (req, res) => {
  const user = await User.find();
  if (user) {
    return res.status(200).json({ success: true, user: user });
  }
  return res.status(200).json({ success: true, user: user });
});

app.post("/", async (req, res) => {
  const { name, email } = req.body;
  try {
    if (!name || !email) {
      return res.status(400).json({ success: true, mess: "all require" });
    }

    const newUser = await User.create({
      name,
      email,
    });

    return res.status(200).json({ success: true, user: newUser });
  } catch (error) {
    console.log(error);
  }
});

app.listen(3000, () => {
  console.log(`Server running at port 3000`);
});
