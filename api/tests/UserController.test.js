import request from "supertest";
import app from "../app.js";
import bcrypt from "bcrypt";
import { userModel } from "../Models/User/userModel.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

describe("User Controller", () => {
  describe("POST Signup", () => {
    describe("Validation tests", () => {
      test("should return 400 if username, email, or password is missing", async () => {
        const bodyData = [
          { username: "username" },
          { password: "password" },
          { email: "email" },
          { username: "username", email: "email" },
          { password: "password", email: "email" },
          {},
        ];

        for (const body of bodyData) {
          const res = await request(app).post("/api/user/signup").send(body);
          expect(res.statusCode).toBe(400);
          expect(res.body.message).toBeDefined();
        }
      });
    });

    describe("Duplicate checks", () => {
      test("should return 400 for duplicate email", async () => {
        const firstUser = {
          username: "mahdi",
          email: "mahdi@test.com",
          password: "1234",
        };

        await request(app).post("/api/user/signup").send(firstUser);

        const res = await request(app).post("/api/user/signup").send({
          username: "mahdi2",
          email: firstUser.email,
          password: "anotherpass",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/email already in use/i);
      });

      test("should return 400 for duplicate username", async () => {
        const user = {
          username: "mahdi",
          email: "mahdi123@gmail.com",
          password: "1234",
        };

        await request(app).post("/api/user/signup").send(user);

        const res = await request(app).post("/api/user/signup").send({
          username: "mahdi",
          email: "mahdi@gmail.com",
          password: "1234",
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toMatch(/Username is not available/i);
      });
    });

    // Clean all collections after all tests in this block
    afterAll(async () => {
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("POST Signin", () => {
    const testUser = {
      username: "mahdi",
      email: "mahdi@test.com",
      password: "1234",
    };

    beforeAll(async () => {
      // Create a test user with hashed password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      await userModel.create({
        ...testUser,
        password: hashedPassword,
      });
    });

    describe("Validation tests", () => {
      test("should return 400 if email is missing", async () => {
        const res = await request(app)
          .post("/api/user/signin")
          .send({ password: "1234" });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBeDefined();
      });

      test("should return 400 if password is missing", async () => {
        const res = await request(app)
          .post("/api/user/signin")
          .send({ email: testUser.email });
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBeDefined();
      });

      test("should return 400 if both email and password are missing", async () => {
        const res = await request(app).post("/api/user/signin").send({});
        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBeDefined();
      });
    });

    describe("Authentication tests", () => {
      test("should return 401 for wrong email", async () => {
        const res = await request(app).post("/api/user/signin").send({
          email: "wrong@test.com",
          password: testUser.password,
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/email or password is wrong/i);
      });

      test("should return 401 for wrong password", async () => {
        const res = await request(app).post("/api/user/signin").send({
          email: testUser.email,
          password: "wrongpassword",
        });
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toMatch(/email or password is wrong/i);
      });

      test("should return 200 and accessToken for correct credentials", async () => {
        const res = await request(app).post("/api/user/signin").send({
          email: testUser.email,
          password: testUser.password,
        });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("accessToken");
        expect(res.body).toHaveProperty("id", expect.any(String));
        expect(res.body).toHaveProperty("username", testUser.username);
        expect(res.body).toHaveProperty("avatar");
        expect(res.body).toHaveProperty("role");
        expect(res.body).toHaveProperty("favorites");
        expect(res.body).toHaveProperty("mobileNumber");
      });
    });

    // Clean all collections after all tests in this block
    afterAll(async () => {
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("Google Auth", () => {
    const existingUser = {
      username: "mahdi",
      email: "mahdi@gmail.com",
      password: "1234",
    };

    beforeAll(async () => {
      // create an existing user in the DB
      await userModel.create(existingUser);
    });

    test("should return 200 and accessToken if user already exists", async () => {
      const res = await request(app).post("/api/user/google").send({
        email: existingUser.email,
        name: "Existing User",
        avatar: "avatar.png",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username", existingUser.username);
      expect(res.body).toHaveProperty("avatar");
    });

    test("should create a new user and return 200 if user does not exist", async () => {
      const newUserEmail = "newuser@test.com";

      const res = await request(app).post("/api/user/google").send({
        email: newUserEmail,
        name: "New User",
        avatar: "newavatar.png",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username"); // new username generated
      expect(res.body).toHaveProperty("avatar", "newavatar.png");

      // Check that user is created in the database
      const userInDb = await userModel.findOne({ email: newUserEmail });
      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe(res.body.username);
    });

    afterAll(async () => {
      // Clean DB after tests
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("Update User (Basic Info)", () => {
    let testUser;
    let token;

    beforeAll(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash("1234", 10);
      testUser = await userModel.create({
        username: "updateuser",
        email: "update@test.com",
        password: hashedPassword,
      });

      // Generate JWT
      token = jwt.sign(
        { user: { id: testUser._id, username: testUser.username } },
        process.env.SECRET_KEY
      );
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .put(`/api/user/update/${testUser._id}`)
        .send({ username: "newname" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 404 if user does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/user/update/${fakeId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "newname" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/user not found/i);
    });

    test("should update username and avatar", async () => {
      const res = await request(app)
        .put(`/api/user/update/${testUser._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ username: "newname", avatar: "newavatar.png" });

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe("newname");
      expect(res.body.avatar).toBe("newavatar.png");
    });

    afterAll(async () => {
      // Clean up database
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("Update User Favorites", () => {
    let testUser;
    let token;
    let favoriteItem;

    beforeAll(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash("1234", 10);
      testUser = await userModel.create({
        username: "favuser",
        email: "fav@test.com",
        password: hashedPassword,
        favorites: [],
      });

      // Generate JWT
      token = jwt.sign(
        { user: { id: testUser._id, username: testUser.username } },
        process.env.SECRET_KEY
      );

      favoriteItem = new mongoose.Types.ObjectId();
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .put(`/api/user/update/${testUser._id}/favorites`)
        .send({ favorites: favoriteItem });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/User is not authorized/i);
    });

    test("should return 404 if user does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/user/update/${fakeId}/favorites`)
        .set("Authorization", `Bearer ${token}`)
        .send({ favorites: favoriteItem });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/user not found/i);
    });

    test("should add a favorite item", async () => {
      const res = await request(app)
        .put(`/api/user/update/${testUser._id}/favorites`)
        .set("Authorization", `Bearer ${token}`)
        .send({ favorites: favoriteItem });

      expect(res.statusCode).toBe(200);
      expect(res.body.favorites).toContain(favoriteItem.toString());
    });

    test("should remove a favorite item", async () => {
      // First add it manually to favorites
      await userModel.findByIdAndUpdate(testUser._id, {
        $addToSet: { favorites: favoriteItem },
      });

      const res = await request(app)
        .put(`/api/user/update/${testUser._id}/favorites`)
        .set("Authorization", `Bearer ${token}`)
        .send({ favorites: favoriteItem, removeFavorites: true });

      expect(res.statusCode).toBe(200);
      expect(res.body.favorites).not.toContain(favoriteItem.toString());
    });

    afterAll(async () => {
      // Clean up database
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("Delete User", () => {
    let testUser;
    let token;

    beforeAll(async () => {
      // Create a user in DB
      const hashedPassword = await bcrypt.hash("1234", 10);
      testUser = await userModel.create({
        username: "deleteuser",
        email: "delete@test.com",
        password: hashedPassword,
      });

      // Generate a JWT for authentication
      token = jwt.sign(
        { user: { id: testUser._id, username: testUser.username } },
        process.env.SECRET_KEY
      );
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app).delete(`/api/user/delete/${testUser._id}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 404 if user does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/user/delete/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test("should delete the user successfully", async () => {
      const res = await request(app)
        .delete(`/api/user/delete/${testUser._id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.statusCode).toBe(200);
      expect(res.body._id).toBe(testUser._id.toString());

      // Verify user is removed from DB
      const userInDb = await userModel.findById(testUser._id);
      expect(userInDb).toBeNull();
    });

    afterAll(async () => {
      // Clean DB after tests
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });
  });

  describe("Get User Info", () => {
    let testUser;
    let token;

    beforeAll(async () => {
      const hashedPassword = await bcrypt.hash("1234", 10);
      testUser = await userModel.create({
        username: "infoUser",
        email: "info@test.com",
        password: hashedPassword,
        mobileNumber: "1234567890",
        favorites: [],
      });

      token = jwt.sign(
        { user: { id: testUser._id, username: testUser.username } },
        process.env.SECRET_KEY
      );
    });

    afterAll(async () => {
      const collections = Object.values(mongoose.connection.collections);
      for (const collection of collections) {
        await collection.deleteMany({});
      }
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app).get(`/api/user/userInfo/${testUser._id}`);
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 404 if user does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/user/userInfo/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });

    test("should return user information successfully", async () => {
      const res = await request(app)
        .get(`/api/user/userInfo/${testUser._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("username", testUser.username);
      expect(res.body).toHaveProperty("email", testUser.email);
      expect(res.body).toHaveProperty("mobileNumber", testUser.mobileNumber);
      expect(res.body).toHaveProperty("favorites");
    });
  });
});
