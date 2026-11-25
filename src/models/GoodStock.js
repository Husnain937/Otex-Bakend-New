import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodItem",
      required: true,
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    },
    avgPrice: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);
stockSchema.index({ item: 1 });

export default mongoose.model("GoodStock", stockSchema);
