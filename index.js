import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDb from "./src/connectDb/connection.js";
import authRoutes from "./src/routes/authRoutes.js";
import Itemrouter from "./src/routes/itemRoutes.js";
import StockRoutes from "./src/routes/stockRoutes.js";
import GoodItemrouter from "./src/routes/GooditemRoutes.js";
import GoodStockRoutes from "./src/routes/GoodstockRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
dotenv.config();
const app = express();

/* =======================
   MIDDLEWARES
======================= */
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));

app.use(express.json({ limit: "10mb" }));

/* =======================
   HEALTH CHECK
======================= */
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});
app.use("/api/auth", authRoutes);
app.use("/api/items", Itemrouter);
app.use("/api/stock", StockRoutes);
app.use("/api/Gooditems", GoodItemrouter);
app.use("/api/Goodstock", GoodStockRoutes);
app.use("/api/dashboard", dashboardRoutes);


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error"
  });
});
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running successfully",
    timestamp: new Date().toISOString(),
  });
});
/* =======================
   START SERVER
======================= */

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDb();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();