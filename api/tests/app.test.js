import request from "supertest";
import app from "../app.js";

describe("POST /api/user for creating user", () => {
  describe("when username,email and password is missing", () => {
    test("should return 400 ", async () => {
      const bodyData = [
        { username: "username" },
        { password: "password" },
        { email: "email" },
        { username: "username", email: "email" },
        { password: "password", email: "email" },
        {},
      ];
      for (const body of bodyData) {
        const res = await request(app).post("/api/user/signup");
        expect(res.statusCode).toBe(400);
      }
    });
  });

  describe("When email already exists", () => {
    const userData = {
      username: "mahdi",
      email: "mahdi@test.com",
      password: "test1234",
    };

    beforeAll(async () => {
      // Create the initial user
      await request(app).post("/api/user").send(userData);
    });

    test("should return 400 for duplicate email", async () => {
      const response = await request(app).post("/api/user/signup").send({
        username: "mahdi2",
        email: userData.email, // duplicate email
        password: "anotherpass",
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty("title", "Duplicate value");
      expect(response.body.message).toMatch(/duplicate/i);
    });
  });
});
