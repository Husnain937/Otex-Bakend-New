/** @format */

import mongoose from "mongoose";

const stockLedgerSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },
    // 🔒 IMMUTABLE SNAPSHOT (THIS SAVES YOU)
    itemSnapshot: {
      name: String,
      sku: String,
      uom: String,
    },
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
    },
   billNO: {
  type: String,
  required: true,
  index: true
},
    unitPrice: {
      type: Number,
      default: 0,
    },

    totalValue: {
      type: Number,
      default: 0,
    },

    source: {
      type: String,
    },

    reference: {
      type: String,
    },
  },
  { timestamps: true }
);
stockLedgerSchema.index({ item: 1, createdAt: -1 });
stockLedgerSchema.index({ type: 1, createdAt: -1 });


export default mongoose.model("StockLedger", stockLedgerSchema);
