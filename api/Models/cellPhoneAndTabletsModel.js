import mongoose from "mongoose";

const cellPhoneAndTabletsSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please Provide name"],
    },
    description: {
      type: String,
      required: [true, "Please provide description"],
    },
    address: {
      type: String,
      required: [true, "Please provide address"],
    },
    regularPrice: {
      type: Number,
      required: [true, "Please provide price"],
    },
    discountPrice: {
      type: Number,
      required: [true, "Please provide discount Price"],
    },
    brand: {
      type: String,
      required: [true, "Please provide brand"],
    },
    model: {
      type: String,
      //   required: [true, "Please provide model"],
    },
    numberOfSimCard: {
      type: Number,
      //   required: [true, "Please provide nu"],
    },
    storage: {
      type: String,
      required: [true, "Please provide storage"],
    },
    RAM: {
      type: String,
      required: [true, "Please provide RAM"],
    },
    color: {
      type: String,
      required: [true, "Please provide color"],
    },
    imageURLs: {
      type: Array,
      required: [true, "Please provide at least one image"],
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user Id"],
    },
  },
  {
    timestamps: true,
  }
);

export const cellPhoneAndTabletsModel = mongoose.model(
  "Listing",
  cellPhoneAndTabletsSchema
);
