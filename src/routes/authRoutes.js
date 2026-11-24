import express from "express";
import { login, register ,getUsers , getUserById ,updateUser , getProfile,updateProfile,deleteUser } from "../controllers/authController.js";
import { protect,allowRoles } from "../middlewares/authMiddleware.js";
const router = express.Router();

router.post("/login", login);
router.post("/register", protect, allowRoles("admin"), register);
router.get("/users",protect,allowRoles("admin"), getUsers);
router.get("/users/:id", protect,allowRoles("admin"), getUserById);
router.patch("/users/:id", protect,allowRoles("admin"), updateUser);
router.get("/", protect, getProfile);
router.put("/", protect, updateProfile);
router.delete("/deleteUser/:id", protect, deleteUser);


export default router;
