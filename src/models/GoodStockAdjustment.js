import mongoose from "mongoose";

const stockAdjustSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodItem",
      required: true
    },
   // 🔒 SNAPSHOT (IMMUTABLE)
    itemSnapshot: {
      name: String,
      sku: String,
      uom: String
    },

    type: {
      type: String,
      enum: ["Increase", "Decrease"],
      required: true
    },

    quantity: {
      type: Number,
      required: true
    },
//     billNO: {
//   type: String,
//   index: true
// },
    reason: {
      type: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("GoodStockAdjustment", stockAdjustSchema);
