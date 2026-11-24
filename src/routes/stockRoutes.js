import express from "express";
import { getStockMaster ,getStockLedger , adjustStock} from "../controllers/stockController.js";
import { protect,allowRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/master", protect, getStockMaster);
router.get("/ledger", protect, getStockLedger);
router.post("/adjust", protect, adjustStock);

export default router;
