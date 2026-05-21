import express from "express";
import { createWorkspace, getWorkspaces, getWorkspaceBoards, updateWorkspace, deleteWorkspace, updateMemberRole, evictMember } from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createWorkspace);
router.get("/", authMiddleware, getWorkspaces);
router.get("/:id/boards", authMiddleware, requireRole(["admin", "editor", "viewer"]), getWorkspaceBoards);
router.put("/:id", authMiddleware, requireRole(["admin"]), updateWorkspace);
router.delete("/:id", authMiddleware, requireRole(["admin"]), deleteWorkspace);

// Role & evict collaborators management
router.put("/:id/members/:memberId/role", authMiddleware, requireRole(["admin"]), updateMemberRole);
router.delete("/:id/members/:memberId", authMiddleware, requireRole(["admin"]), evictMember);

export default router;
