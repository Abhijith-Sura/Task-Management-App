import express from "express";
import { getProfile, updateProfile, getUserAssets } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   GET /api/users/profile
 * @desc    Retrieve the authenticated user's profile information
 * @access  Private
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update the authenticated user's profile details
 * @access  Private
 */
router.put("/profile", authMiddleware, updateProfile);

/**
 * @route   GET /api/users/assets
 * @desc    Retrieve user-associated assets (e.g., boards, workspaces)
 * @access  Private
 */
router.get("/assets", authMiddleware, getUserAssets);

export default router;
