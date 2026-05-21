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

// Static routes MUST come before parameterized routes
router.get("/mine", authMiddleware, getMyCards);
router.get("/search", authMiddleware, globalSearch);
router.post("/", authMiddleware, requireRole(["admin", "editor"]), createCard);
router.put("/move", authMiddleware, requireRole(["admin", "editor"]), moveCard);
router.post("/upload", authMiddleware, upload.single("file"), requireRole(["admin", "editor"]), uploadAttachment);

// Parameterized routes
router.put("/:cardId", authMiddleware, requireRole(["admin", "editor"]), updateCard);
router.delete("/:cardId", authMiddleware, requireRole(["admin", "editor"]), deleteCard);
router.get("/:cardId/activity", authMiddleware, requireRole(["admin", "editor", "viewer"]), getCardActivity);
router.get("/:cardId/comments", authMiddleware, requireRole(["admin", "editor", "viewer"]), getComments);
router.post("/:cardId/comments", authMiddleware, requireRole(["admin", "editor"]), addComment);

export default router;