import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    uom: { type: String, required: true }, // e.g. pcs, kg, meter
    minLevel: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    currentStock: { type: Number, default: 0 }, // updated by Stock IN/OUT
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);
itemSchema.index({ sku: 1 });
itemSchema.index({ name:1 });
export default mongoose.model("GoodItem", itemSchema);
