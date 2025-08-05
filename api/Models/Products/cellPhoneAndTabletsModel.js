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
      // required: [t, "Please provide discount Price"],
      default: null,
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
    condition: {
      type: String,
      // required: [false, "Please provide the condition of cell phone"],
    },
    userRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Please provide user Id"],
    },
    mainCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide main category Id"],
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide sub category Id"],
    },
    mainCategoryName: {
      type: mongoose.Schema.Types.String,
      required: [true, "Pleas provide main category name"],
    },
    subCategoryName: {
      type: mongoose.Schema.Types.String,
      required: [true, "Pleas provide sub category name"],
    },
  },
  {
    timestamps: true,
  }
);

export const cellPhoneAndTabletsModel = mongoose.model(
  "cellPhone_Tablets",
  cellPhoneAndTabletsSchema
);
