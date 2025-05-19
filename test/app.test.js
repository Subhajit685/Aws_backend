// test/app.test.js
import request from "supertest";
import app from "../index.js"; // import app, NOT server

describe("GET /user", () => {
  it("should return list of users", async () => {
    const res = await request(app).get("/user");
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty("success", true);
    expect(Array.isArray(res.body.user)).toBe(true);
  });
});


