import express from "express";
import { 
  createBoard, 
  createBoardFromTemplate,
  getBoards, 
  getBoardDetail, 
  updateBoard, 
  inviteMember, 
  deleteBoard, 
  getBoardActivity, 
  generateInviteLink, 
  joinViaLink, 
  sendInviteEmail, 
  resetInviteLink,
  createInvitation,
  getInvitations,
  revokeInvitation,
  resendInvitation,
  acceptInvitation,
  getAutomations,
  createAutomation,
  toggleAutomation,
  deleteAutomation,
  searchBoardCards
} from "../controllers/boardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/**
 * @module BoardRoutes
 * @description Defines Express routes for managing boards, board invitations, members, and automations.
 */

// ==========================================
// Static Routes
// ==========================================

/**
 * @route POST /
 * @description Creates a new board.
 * @access Private (Admin, Editor)
 */
router.post("/", authMiddleware, requireRole(["admin", "editor"]), createBoard);

/**
 * @route POST /create-from-template
 * @description Creates a new board using a pre-defined template.
 * @access Private (Admin, Editor)
 */
router.post("/create-from-template", authMiddleware, requireRole(["admin", "editor"]), createBoardFromTemplate);

/**
 * @route GET /
 * @description Retrieves a list of boards accessible by the authenticated user.
 * @access Private
 */
router.get("/", authMiddleware, getBoards);

/**
 * @route PUT /invite
 * @description Invites a new member to a board (legacy or standard direct invite).
 * @access Private (Admin)
 */
router.put("/invite", authMiddleware, requireRole(["admin"]), inviteMember);

// ==========================================
// Targeted Individual Invitations (Global)
// ==========================================

/**
 * @route POST /invitations/accept/:token
 * @description Accepts an invitation to join a board using a secure token.
 * @access Private
 * @note Acceptance is validated via the token and the current authenticated userId.
 */
router.post("/invitations/accept/:token", authMiddleware, acceptInvitation);

// ==========================================
// Parameterized Routes (Board Specific)
// ==========================================

/**
 * @route GET /:id
 * @description Retrieves detailed information for a specific board.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:id", authMiddleware, requireRole(["admin", "editor", "viewer"]), getBoardDetail);

/**
 * @route PUT /:id
 * @description Updates the details, lists, or configuration of a specific board.
 * @access Private (Admin, Editor)
 */
router.put("/:id", authMiddleware, requireRole(["admin", "editor"]), updateBoard);

/**
 * @route DELETE /:id
 * @description Deletes a board permanently.
 * @access Private (Admin)
 */
router.delete("/:id", authMiddleware, requireRole(["admin"]), deleteBoard);

/**
 * @route GET /:id/activity
 * @description Retrieves the activity log (history of changes) for a specific board.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:id/activity", authMiddleware, requireRole(["admin", "editor", "viewer"]), getBoardActivity);

/**
 * @route GET /:id/search
 * @description Searches for cards within a specific board.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:id/search", authMiddleware, requireRole(["admin", "editor", "viewer"]), searchBoardCards);

// ==========================================
// Board Invite Links & Emails
// ==========================================

/**
 * @route GET /:id/invite-link
 * @description Generates a shareable invite link for a board.
 * @access Private
 */
router.get("/:id/invite-link", authMiddleware, generateInviteLink);

/**
 * @route POST /:id/invite-link/reset
 * @description Resets the shareable invite link, invalidating any previous links.
 * @access Private
 */
router.post("/:id/invite-link/reset", authMiddleware, resetInviteLink);

/**
 * @route POST /join/:token
 * @description Joins a board using a shareable invite link token.
 * @access Private
 * @note Joining bypasses active workspace role checks, as the user is implicitly granted access.
 */
router.post("/join/:token", authMiddleware, joinViaLink);

/**
 * @route POST /:id/invite-email
 * @description Sends an email invitation to join a board.
 * @access Private (Admin)
 */
router.post("/:id/invite-email", authMiddleware, requireRole(["admin"]), sendInviteEmail);

// ==========================================
// Targeted Individual Invitations Management
// ==========================================

/**
 * @route POST /:id/invitations
 * @description Creates a targeted invitation for a specific user to join a board.
 * @access Private (Admin)
 */
router.post("/:id/invitations", authMiddleware, requireRole(["admin"]), createInvitation);

/**
 * @route GET /:id/invitations
 * @description Retrieves a list of pending targeted invitations for a board.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:id/invitations", authMiddleware, requireRole(["admin", "editor", "viewer"]), getInvitations);

/**
 * @route DELETE /:id/invitations/:inviteId
 * @description Revokes or deletes a pending targeted invitation.
 * @access Private (Admin)
 */
router.delete("/:id/invitations/:inviteId", authMiddleware, requireRole(["admin"]), revokeInvitation);

/**
 * @route POST /:id/invitations/:inviteId/resend
 * @description Resends a targeted invitation email to the invitee.
 * @access Private (Admin)
 */
router.post("/:id/invitations/:inviteId/resend", authMiddleware, requireRole(["admin"]), resendInvitation);

// ==========================================
// Workflow Automation Rules Management
// ==========================================

/**
 * @route GET /:id/automations
 * @description Retrieves all configured workflow automations for a board.
 * @access Private (Admin, Editor, Viewer)
 */
router.get("/:id/automations", authMiddleware, requireRole(["admin", "editor", "viewer"]), getAutomations);

/**
 * @route POST /:id/automations
 * @description Creates a new automation rule for a board.
 * @access Private (Admin, Editor)
 */
router.post("/:id/automations", authMiddleware, requireRole(["admin", "editor"]), createAutomation);

/**
 * @route PUT /:id/automations/:automationId
 * @description Toggles an automation rule on or off.
 * @access Private (Admin, Editor)
 */
router.put("/:id/automations/:automationId", authMiddleware, requireRole(["admin", "editor"]), toggleAutomation);

/**
 * @route DELETE /:id/automations/:automationId
 * @description Deletes an automation rule from a board.
 * @access Private (Admin, Editor)
 */
router.delete("/:id/automations/:automationId", authMiddleware, requireRole(["admin", "editor"]), deleteAutomation);

export default router;