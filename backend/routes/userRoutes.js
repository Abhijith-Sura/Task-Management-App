import express from "express";
import { getProfile, updateProfile, getUserAssets } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.get("/assets", authMiddleware, getUserAssets);

export default router;
