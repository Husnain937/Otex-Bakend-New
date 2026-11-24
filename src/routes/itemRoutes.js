import express from "express";
import {
  createItem,
  listItems,
  getItem,
  updateItem,
  deleteItem,
  getItemDropdown
} from "../controllers/ItemController.js";

import { protect,allowRoles } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Only stock or admin or purchase roles can create items (adjust if you like)
router.post("/", protect, allowRoles("admin", "stock", "purchase"), createItem);

// list accessible to logged-in users (or limit by role)
router.get("/", protect, listItems);
router.get("/dropdown/items", protect, getItemDropdown);

router.get("/:id", protect, getItem);

// update allowed for admin, stock, purchase
router.put("/:id", protect, allowRoles("admin", "stock", "purchase"), updateItem);

// delete only admin
router.delete("/:id", protect, allowRoles("admin"), deleteItem);

export default router;
