import express from "express";
import { createList, getLists, deleteList, updateList } from "../controllers/listController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, requireRole(["admin", "editor"]), createList);
router.get("/:boardId", authMiddleware, requireRole(["admin", "editor", "viewer"]), getLists);
router.put("/:id", authMiddleware, requireRole(["admin", "editor"]), updateList);
router.delete("/:id", authMiddleware, requireRole(["admin", "editor"]), deleteList);

export default router;