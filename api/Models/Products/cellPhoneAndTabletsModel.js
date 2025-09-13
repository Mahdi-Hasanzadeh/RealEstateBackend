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
      default: null,
    },
    offer: {
      type: Boolean,
      default: false,
    },
    brand: {
      type: String,
      required: [true, "Please provide brand"],
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
    mainCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide main category Id"],
      ref: "MainCategory",
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please provide sub category Id"],
      ref: "SubCategory",
    },
    mainCategoryName: {
      type: mongoose.Schema.Types.String,
      required: [true, "Pleas provide main category name"],
    },
    subCategoryName: {
      type: mongoose.Schema.Types.String,
      required: [true, "Pleas provide sub category name"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isRejected: { type: Boolean, default: false },
    RejectedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

cellPhoneAndTabletsSchema.index({ isDeleted: 1, userRef: 1 });

export const cellPhoneAndTabletsModel = mongoose.model(
  "cellPhone_Tablets",
  cellPhoneAndTabletsSchema
);
