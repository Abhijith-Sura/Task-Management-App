import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { 
  uploadAttachment, createCard, moveCard, updateCard, 
  getCardActivity, addComment, getComments, deleteCard, getMyCards,
  globalSearch
} from "../controllers/cardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @module CardRoutes
 * @description Express routes for managing cards, attachments, comments, and global card searches.
 */

// ==========================================
// Static Routes
// ==========================================
// Note: Static routes MUST come before parameterized routes to prevent matching conflicts.

/**
 * @route GET /mine
 * @description Retrieves all cards assigned to the authenticated user.
 * @access Private
 */
router.get("/mine", authMiddleware, getMyCards);

/**
 * @route GET /search
 * @description Performs a global search across all cards accessible to the user.
 * @access Private
 */
router.get("/search", authMiddleware, globalSearch);

/**
 * @route POST /
 * @description Creates a new card in a specified board list.
 * @access Private (Admin, Editor)
 */
router.post("/", authMiddleware, requireRole(["admin", "editor"]), createCard);

/**
 * @route PUT /move
 * @description Moves a card to a new position or a different list.
 * @access Private (Admin, Editor)
 */
router.put("/move", authMiddleware, requireRole(["admin", "editor"]), moveCard);

/**
 * @route POST /upload
 * @description Uploads a file attachment to a card.
 * @access Private (Admin, Editor)
 */
router.post("/upload", authMiddleware, upload.single("file"), requireRole(["admin", "editor"]), uploadAttachment);

// ==========================================
// Parameterized Routes
// ==========================================

/**
 * @route PUT /:cardId
 * @description Updates card details (title, description, due date, labels, assignees).
 * @access Private (Admin, Editor)
 */
router.put("/:cardId", authMiddleware, requireRole(["admin", "editor"]), updateCard);

/**
 * @route DELETE /:cardId
 * @description Deletes a specific card permanently.
 * @access Private (Admin, Editor)
 */
router.delete("/:cardId", authMiddleware, requireRole(["admin", "editor"]), deleteCard);

/**
 * @route GET /:cardId/activity
 * @description Retrieves the activity history and audit log of a specific card.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:cardId/activity", authMiddleware, requireRole(["admin", "editor", "viewer"]), getCardActivity);

/**
 * @route GET /:cardId/comments
 * @description Fetches all comments added to a specific card.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:cardId/comments", authMiddleware, requireRole(["admin", "editor", "viewer"]), getComments);

/**
 * @route POST /:cardId/comments
 * @description Adds a new comment to a specific card.
 * @access Private (Admin, Editor)
 */
router.post("/:cardId/comments", authMiddleware, requireRole(["admin", "editor"]), addComment);

export default router;