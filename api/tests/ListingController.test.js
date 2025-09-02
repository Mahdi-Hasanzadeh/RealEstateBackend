import request from "supertest";
import app from "../app.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { mainCategoryModel } from "../Models/Category/MainCategory";
import { subCategoryModel } from "../Models/Category/SubCategory";
import { listingModel } from "../Models/Products/listingModel";
import { cellPhoneAndTabletsModel } from "../Models/Products/cellPhoneAndTabletsModel";
import { computerModel } from "../Models/Products/computerModel";
import {
  cellPhoneAndTablets,
  computer,
  digitalEquipment,
} from "../Utility/constants.js";

describe("Listing", () => {
  describe("Create Listing", () => {
    let token;
    let userId;

    beforeAll(async () => {
      // Clean DB
      await mainCategoryModel.deleteMany({});
      await subCategoryModel.deleteMany({});
      await listingModel.deleteMany({});
      await cellPhoneAndTabletsModel.deleteMany({});
      await computerModel.deleteMany({});

      // Create JWT token
      userId = new mongoose.Types.ObjectId();
      const payload = { user: { id: userId, username: "tester" } };
      token = jwt.sign(payload, process.env.SECRET_KEY);
    });

    test("should return 401 if user is not authenticated", async () => {
      const res = await request(app)
        .post("/api/listing/create")
        .send({ mainCategory: "estate" });

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    test("should return 404 if mainCategory is missing", async () => {
      const res = await request(app)
        .post("/api/listing/create")
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Test Listing" });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toMatch(/provide main category/i);
    });

    test("should create a listing under existing main category (estate)", async () => {
      await mainCategoryModel.create({ name: "estate" });

      const listingPayload = {
        mainCategory: "estate",
        name: "Estate Listing",
        description: "Nice house",
        address: "123 Test St",
        regularPrice: 250000,
        discountPrice: 200000,
        bedrooms: 3,
        bath: 2,
        furnished: true,
        parking: true,
        type: "rent",
        offer: true,
        imageURLs: ["https://example.com/house.jpg"],
        // userRef will be injected from req.user via token
      };

      const res = await request(app)
        .post("/api/listing/create")
        .set("Authorization", `Bearer ${token}`)
        .send(listingPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("_id");
      expect(res.body.name).toBe("Estate Listing");

      // Verify saved in DB
      const listingInDb = await listingModel.findById(res.body._id);
      expect(listingInDb).not.toBeNull();
      expect(listingInDb.name).toBe("Estate Listing");
      expect(listingInDb.address).toBe("123 Test St");
    });

    test("should create a listing under digital equipment with new subcategory", async () => {
      const res = await request(app)
        .post("/api/listing/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          mainCategory: digitalEquipment,
          subCategory: cellPhoneAndTablets,
          name: "iPhone 15",
          description: "Brand new",
          address: "Herat",
          regularPrice: 2000,
          brand: "IPhone",
          storage: "1280gb",
          RAM: "24gb",
          color: "green",
          imageURLs: ["https://image"],
        });

      expect(res.statusCode).toBe(201);
    });

    test("should create a listing under digital equipment with new subcategory", async () => {
      const res = await request(app)
        .post("/api/listing/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          mainCategory: digitalEquipment,
          subCategory: computer,
          name: "Dell",
          description: "Brand new",
          address: "Herat",
          regularPrice: 2000,
          brand: "DELL",
          storage: "1280gb",
          RAM: "24gb",
          imageURLs: ["https://image"],
        });

      expect(res.statusCode).toBe(201);
    });

    afterAll(async () => {
      await mongoose.connection.dropDatabase();
    });
  });
});
