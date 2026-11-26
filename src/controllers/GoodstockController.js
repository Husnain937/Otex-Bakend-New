import Item from "../models/GoodItem.js";
import StockLedger from "../models/GoodStockLedger.js";
import StockAdjustment from "../models/GoodStockAdjustment.js";
import Stock from "../models/GoodStock.js";
import mongoose from "mongoose";

export const getStockMaster = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim();

    /* =============================
       MATCH CONDITIONS
    ============================= */
    const matchConditions = [];

    if (search) {
      matchConditions.push({
        $or: [
          { "item.name": { $regex: search, $options: "i" } },
          { "item.sku": { $regex: search, $options: "i" } },
          { "item.uom": { $regex: search, $options: "i" } },
          { "item.note": { $regex: search, $options: "i" } },
        ],
      });
    }

    /* =============================
       DATA PIPELINE
    ============================= */
    const dataPipeline = [
      {
        $lookup: {
          from: "gooditems",
          localField: "item",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },

      ...(matchConditions.length
        ? [{ $match: { $and: matchConditions } }]
        : []),

      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $project: {
          quantity: 1,
          "item._id": 1,
          "item.name": 1,
          "item.sku": 1,
          "item.uom": 1,
          "item.category": 1,
          "item.minLevel":1,
          "item.reorderLevel":1,
          "item.note":1,
        },
      },
    ];

    const stock = await Stock.aggregate(dataPipeline);

    /* =============================
       COUNT PIPELINE
    ============================= */
    const countPipeline = [
      {
        $lookup: {
          from: "gooditems",
          localField: "item",
          foreignField: "_id",
          as: "item",
        },
      },
      { $unwind: "$item" },

      ...(matchConditions.length
        ? [{ $match: { $and: matchConditions } }]
        : []),

      { $count: "total" },
    ];

    const countResult = await Stock.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;
    /* =============================
       RESPONSE
    ============================= */
    res.json({
      success: true,
      data: stock,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const getStockLedger = async (req, res) => {
  try {
    /* =============================
       PAGINATION
    ============================= */
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const skip = (page - 1) * limit;

    /* =============================
       QUERY PARAMS
    ============================= */
    const search = req.query.search?.trim();
    const { startDate, endDate, item, type } = req.query;

    /* =============================
       MATCH OBJECT
    ============================= */
    const match = {};

    /* ---- Item Filter ---- */
    if (item && mongoose.Types.ObjectId.isValid(item)) {
      match.item = new mongoose.Types.ObjectId(item);
    }

    /* ---- Type Filter ---- */
    if (type) {
      match.type = type;
    }

    /* ---- Search Filter ---- */
    if (search) {
      match.$or = [
        { reference: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
        { billNO: { $regex: search, $options: "i" } },
        { "itemSnapshot.name": { $regex: search, $options: "i" } },
        { "itemSnapshot.sku": { $regex: search, $options: "i" } },
         { "itemSnapshot.note": { $regex: search, $options: "i" } }
      ];
    }

    /* ---- Date Filter ---- */
    if (startDate || endDate) {
      match.createdAt = {};

      if (startDate) {
        match.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        match.createdAt.$lte = new Date(`${endDate}T23:59:59.999Z`);
      }
    }

    /* =============================
       FETCH DATA
    ============================= */
    const [ledger, total] = await Promise.all([
      StockLedger.find(match)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select({
          quantity: 1,
          type: 1,
          billNO:1,
          source: 1,
          reference: 1,
          createdAt: 1,
          itemId: 1,
          itemSnapshot: 1,
        }),

      StockLedger.countDocuments(match)
    ]);

    /* =============================
       RESPONSE
    ============================= */
    res.json({
      success: true,
      data: ledger,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Stock Ledger Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const adjustStock = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { item, type, quantity, reason,billNO  } = req.body;

    // =============================
    // VALIDATION
    // =============================
    if (!item || !mongoose.Types.ObjectId.isValid(item)) {
      throw new Error("Invalid or missing item");
    }

    if (!type || !["Increase", "Decrease"].includes(type)) {
      throw new Error("Invalid or missing adjustment type");
    }

    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    // =============================
    // FETCH ITEM
    // =============================
    const itemDoc = await Item.findById(item).session(session);
    if (!itemDoc) throw new Error("Item not found");
    if (itemDoc.isActive === false) throw new Error("Item is inactive");

    // =============================
    // FETCH OR CREATE STOCK
    // =============================
    let stock = await Stock.findOne({ item }).session(session);

    if (!stock) {
      [stock] = await Stock.create(
        [
          {
            item,
            quantity: 0,
            avgPrice: 0
          }
        ],
        { session }
      );
    }
// if (!billNO || billNO.trim() === "") {
//   throw new Error("Bill number is required");
// }
    // =============================
    // APPLY ADJUSTMENT
    // =============================
    if (type === "Increase") {
      stock.quantity += qty;
    } else {
      if (stock.quantity < qty) {
        throw new Error("Not enough stock to decrease");
      }
      stock.quantity -= qty;
    }

    await stock.save({ session });

    const reference = `ADJ-${Date.now()}`;

    // =============================
    // STOCK LEDGER ENTRY (with snapshot)
    // =============================
    await StockLedger.create(
      [
        {
          item, // same as your Stock model
          itemSnapshot: {
            name: itemDoc.name,
            sku: itemDoc.sku,
            uom: itemDoc.uom
          },
          type: type === "Increase" ? "IN" : "OUT",
          quantity: qty,
          billNO,
          source: "Adjustment",
          reference
        }
      ],
      { session }
    );

    // =============================
    // STOCK ADJUSTMENT ENTRY (with snapshot)
    // =============================
    await StockAdjustment.create(
      [
        {
          item, // same as your Stock model
          itemSnapshot: {
            name: itemDoc.name,
            sku: itemDoc.sku,
            uom: itemDoc.uom
          },
          type,
          quantity: qty,
          billNO,
          reason
        }
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Stock adjusted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};
