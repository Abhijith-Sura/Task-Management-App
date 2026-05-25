import express from "express";
import { createWorkspace, getWorkspaces, getWorkspaceBoards, updateWorkspace, deleteWorkspace, updateMemberRole, evictMember } from "../controllers/workspaceController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/workspaces
 * @desc    Create a new workspace
 * @access  Private
 */
router.post("/", authMiddleware, createWorkspace);

/**
 * @route   GET /api/workspaces
 * @desc    Retrieve all workspaces for the authenticated user
 * @access  Private
 */
router.get("/", authMiddleware, getWorkspaces);

/**
 * @route   GET /api/workspaces/:id/boards
 * @desc    Retrieve all boards within a specific workspace
 * @access  Private (Admin, Editor, Viewer)
 */
router.get("/:id/boards", authMiddleware, requireRole(["admin", "editor", "viewer"]), getWorkspaceBoards);

/**
 * @route   PUT /api/workspaces/:id
 * @desc    Update workspace details
 * @access  Private (Admin only)
 */
router.put("/:id", authMiddleware, requireRole(["admin"]), updateWorkspace);

/**
 * @route   DELETE /api/workspaces/:id
 * @desc    Delete a workspace
 * @access  Private (Admin only)
 */
router.delete("/:id", authMiddleware, requireRole(["admin"]), deleteWorkspace);

// Role & evict collaborators management

/**
 * @route   PUT /api/workspaces/:id/members/:memberId/role
 * @desc    Update the role of a workspace member
 * @access  Private (Admin only)
 */
router.put("/:id/members/:memberId/role", authMiddleware, requireRole(["admin"]), updateMemberRole);

/**
 * @route   DELETE /api/workspaces/:id/members/:memberId
 * @desc    Remove a member from the workspace
 * @access  Private (Admin only)
 */
router.delete("/:id/members/:memberId", authMiddleware, requireRole(["admin"]), evictMember);

export default router;
