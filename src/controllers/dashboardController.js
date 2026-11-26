import User from "../models/user.js";
import Item from "../models/Item.js";
import Stock from "../models/Stock.js";
import GoodStock from "../models/GoodStock.js";
import GoodItem from "../models/GoodItem.js";
export const getDashboardStats = async (req, res) => {
  try {
    const { role, permissions } = req.user;
    const isAdmin = role === "admin";

    const stats = {};

    /* ================= USERS ================= */
    if (isAdmin || permissions?.users) {
      stats.users = await User.countDocuments();
    }

    /* ================= ITEMS ================= */
    if (isAdmin || permissions?.items) {
      stats.items = await Item.countDocuments();
    }
  stats.goodItems = await GoodItem.countDocuments();
    
    /* ================= STOCK ================= */
    if (isAdmin || permissions?.stock) {
      const stock = await Stock.aggregate([
        {
          $group: {
            _id: null,
            qty: { $sum: "$quantity" },
            value: { $sum: { $multiply: ["$quantity", "$rate"] } },
          },
        },
      ]);

      stats.stockQty = stock[0]?.qty || 0;
      stats.stockValue = stock[0]?.value || 0;
    }
      const goodStock = await GoodStock.aggregate([
    {
      $group: {
        _id: null,
        qty: { $sum: "$quantity" },
        value: { $sum: { $multiply: ["$quantity", "$rate"] } },
      },
    },
  ]);

  stats.goodStockQty = goodStock[0]?.qty || 0;
  stats.goodStockValue = goodStock[0]?.value || 0;
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};