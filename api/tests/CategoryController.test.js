import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { mainCategoryModel } from "../Models/Category/MainCategory.js";
import { subCategoryModel } from "../Models/Category/SubCategory.js";

describe("Category", () => {
  describe("Create Main Category", () => {
    let token;

    beforeAll(async () => {
      // Ensure database is clean
      await mainCategoryModel.deleteMany({});

      // Create a token for authentication
      const payload = {
        user: { id: new mongoose.Types.ObjectId(), username: "admin" },
      };
      token = jwt.sign(payload, process.env.SECRET_KEY);
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .post("/api/category/mainCategory/create")
        .send({ categoryName: "Books" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 400 if categoryName is missing", async () => {
      const res = await request(app)
        .post("/api/category/mainCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({}); // no categoryName

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/provide category name/i);
    });

    test("should return 400 if category already exists", async () => {
      await mainCategoryModel.create({ name: "estate" });

      const res = await request(app)
        .post("/api/category/mainCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ categoryName: "estate" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/already exist/i);
    });

    test("should create a new main category when authenticated", async () => {
      const res = await request(app)
        .post("/api/category/mainCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ categoryName: "Books" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe("Books");

      const categoryInDb = await mainCategoryModel.findById(res.body._id);
      expect(categoryInDb).not.toBeNull();
      expect(categoryInDb.name).toBe("Books");
    });

    afterAll(async () => {
      await mongoose.connection.dropDatabase();
    });
  });

  describe("Create Sub Category", () => {
    let token;
    let mainCategory;

    beforeAll(async () => {
      // Ensure database is clean
      await mainCategoryModel.deleteMany({});
      await subCategoryModel.deleteMany({});

      // Create a main category to reference
      mainCategory = await mainCategoryModel.create({ name: "Electronics" });

      // Create JWT token for authentication
      const payload = {
        user: { id: new mongoose.Types.ObjectId(), username: "admin" },
      };
      token = jwt.sign(payload, process.env.SECRET_KEY);
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .post("/api/category/subCategory/create")
        .send({ mainCategoryName: "Electronics", subCategoryName: "Phones" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 400 if credentials are missing", async () => {
      const res = await request(app)
        .post("/api/category/subCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({}); // missing both fields

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/provide credentials/i);
    });

    test("should return 400 if main category does not exist", async () => {
      const res = await request(app)
        .post("/api/category/subCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ mainCategoryName: "NonExistent", subCategoryName: "Phones" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/main category not exist/i);
    });

    test("should return 400 if sub category already exists", async () => {
      // Create a subcategory first
      await subCategoryModel.create({
        name: "Phones",
        mainCategoryRef: mainCategory._id,
      });

      const res = await request(app)
        .post("/api/category/subCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ mainCategoryName: "Electronics", subCategoryName: "Phones" });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/sub category already exist/i);
    });

    test("should create a new sub category when authenticated", async () => {
      const res = await request(app)
        .post("/api/category/subCategory/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ mainCategoryName: "Electronics", subCategoryName: "Laptops" });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe("Laptops");
      expect(res.body.mainCategoryRef).toBe(mainCategory._id.toString());

      const subCategoryInDb = await subCategoryModel.findById(res.body._id);
      expect(subCategoryInDb).not.toBeNull();
      expect(subCategoryInDb.name).toBe("Laptops");
    });

    afterAll(async () => {
      // Clean up
      await mongoose.connection.dropDatabase();
    });
  });
});
