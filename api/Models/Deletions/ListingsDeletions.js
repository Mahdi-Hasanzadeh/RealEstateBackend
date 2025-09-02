import mongoose from "mongoose";

const listingDeletionSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  collectionName: { type: String, required: true },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  deletedAt: { type: Date, default: Date.now },
  reason: { type: String, required: true },
});

export const ListingDeletionModel = mongoose.model(
  "ListingDeletion",
  listingDeletionSchema
);
