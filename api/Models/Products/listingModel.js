import mongoose from "mongoose";

const listingSchema = mongoose.Schema(
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
    bedrooms: {
      type: Number,
      required: [true, "Please provide bedrooms"],
    },
    bath: {
      type: Number,
      required: [true, "Please provide bath"],
    },
    furnished: {
      type: Boolean,
      required: [true, "Please provide furnished"],
    },
    parking: {
      type: Boolean,
      required: [true, "Please provide parking"],
    },
    type: {
      type: String,
      required: [true, "Please provide type"],
    },
    offer: {
      type: Boolean,
      required: [true, "Please provide offer"],
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
    },
    mainCategoryName: {
      type: mongoose.Schema.Types.String,
      required: [true, "Pleas provide main category name"],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

listingSchema.index({ isDeleted: 1, userRef: 1 });

export const listingModel = mongoose.model("Listing", listingSchema);
