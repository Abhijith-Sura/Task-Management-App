import express from "express";
import { createList, getLists, deleteList, updateList } from "../controllers/listController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/lists
 * @desc    Create a new list in a board
 * @access  Private (Admin, Editor)
 */
router.post("/", authMiddleware, requireRole(["admin", "editor"]), createList);
/**
 * @route   GET /api/lists/:boardId
 * @desc    Retrieve all lists for a specific board
 * @access  Private (Admin, Editor, Viewer)
 */
router.get("/:boardId", authMiddleware, requireRole(["admin", "editor", "viewer"]), getLists);

/**
 * @route   PUT /api/lists/:id
 * @desc    Update a list's details (e.g., title, position)
 * @access  Private (Admin, Editor)
 */
router.put("/:id", authMiddleware, requireRole(["admin", "editor"]), updateList);

/**
 * @route   DELETE /api/lists/:id
 * @desc    Delete a list by its ID
 * @access  Private (Admin, Editor)
 */
router.delete("/:id", authMiddleware, requireRole(["admin", "editor"]), deleteList);

export default router;