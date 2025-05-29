import dotenv from "dotenv";
dotenv.config();
import express from "express";
const app = express();
import mongoose from "mongoose";
import User from "./model.js";
import cors from "cors";
import { google } from "./google.js";
import * as arctic from "arctic";
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import axios from "axios";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.post("/add", async (req, res) => {
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

const codeVerifiers = new Map();

app.get("/google", (req, res) => {
  const state = arctic.generateState();
  const codeVerifier = arctic.generateCodeVerifier();
  const scopes = ["openid", "profile", "email"];
  const url = google.createAuthorizationURL(state, codeVerifier, scopes);
  codeVerifiers.set(state, codeVerifier);
  res.redirect(url.toString());
});

app.get("/google/callback", async (req, res) => {
  const { state, code } = req.query;

  if (!state || !code) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
  const codeVerifier = codeVerifiers.get(state);
  if (!codeVerifier) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired state" });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    // console.log("User Info:", tokens.data.access_token);
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.data.access_token}`,
      },
    });
    const userInfo = await userInfoResponse.json();
    console.log("Tokens:", userInfo);
    if (!userInfo || !userInfo.email) {
      return res
        .status(400)
        .json({ success: false, message: "User info not found" });
    }

    // Check if user already exists
    let user = await User.findOne({ email: userInfo.email });
    if (!user) {
      // Create new user if not exists
      user = await User.create({
        name: userInfo.name,
        email: userInfo.email,
      });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error during Google authentication:", error);
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
});

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_ID,
  },
});

app.get("/s3", async (req, res) => {
  const { objectKey } = req.body
  const bucketName = process.env.AWS_BUCKET_NAME;
  console.log(objectKey)
  // const objectKey = "path/to/your/object"; // Replace with your S3 object key

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.status(200).json({ success: true, url });
  } catch (error) {
    console.error("Error generating signed URL:", error);
    res.status(500).json({ success: false, message: "Failed to generate URL" });
  }
});

app.post("/upload", upload.single("file"), async (req, res) => {

  const bucketName = process.env.AWS_BUCKET_NAME;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: `${req.file.originalname}${Date.now()}`, // Use the original file name as the key
      ContentType: req.file.mimetype,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const responce = await axios.put(url, req.file.buffer, {
      headers: {
        "Content-Type": req.file.mimetype,
      },
    });
    if (responce.status !== 200) {
      return res.status(500).json({ success: false, message: "File upload failed" });
    }
    res.status(200).json({ success: true, message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ success: false, message: "File upload failed" });
  }
});

app.get("/list", async (req, res) => {
  const bucketName = process.env.AWS_BUCKET_NAME;

  try {
    const command = new ListObjectsCommand({
      Bucket: bucketName,
    });

    const response = await s3Client.send(command);
    const files = response.Contents.map((file) => ({
      key: file.Key,
      lastModified: file.LastModified,
      size: file.Size,
    }));

    if (files.length === 0) {
      return res.status(404).json({ success: false, message: "No files found" });
    }

    const fileUrls = await Promise.all(
      files.map(async (file) => {
        const getCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: file.key,
        });
        const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        return { ...file, url };
      })
    );

    res.status(200).json({ success: true, fileUrls });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ success: false, message: "Failed to list files" });
  }
});


app.listen(3000, () => {
  console.log(`Server running at port 3000`);
});

export default app;
