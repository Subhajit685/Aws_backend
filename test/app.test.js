import request from "supertest";
import app from "../index.js"; // Ensure this does NOT start a server

// Optionally import your database connection if needed
import mongoose from "mongoose";

describe("GET /user", () => {
  it("should return list of users", async () => {
    const res = await request(app).get("/user");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.user)).toBe(true);
  });

  afterAll(async () => {
    // Close DB connection if using MongoDB
    await mongoose.connection.close();

    // If Redis or other connections, close them here too
    // await redisClient.quit(); // Example
  });
});


