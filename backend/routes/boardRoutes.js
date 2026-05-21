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

// Static routes first
router.post("/", authMiddleware, requireRole(["admin", "editor"]), createBoard);
router.post("/create-from-template", authMiddleware, requireRole(["admin", "editor"]), createBoardFromTemplate);
router.get("/", authMiddleware, getBoards);
router.put("/invite", authMiddleware, requireRole(["admin"]), inviteMember);

// Gated Targeted individual invitations
router.post("/invitations/accept/:token", authMiddleware, acceptInvitation); // Acceptance is checked via token and current userId

// Parameterized routes
router.get("/:id", authMiddleware, requireRole(["admin", "editor", "viewer"]), getBoardDetail);
router.put("/:id", authMiddleware, requireRole(["admin", "editor"]), updateBoard);
router.delete("/:id", authMiddleware, requireRole(["admin"]), deleteBoard);
router.get("/:id/activity", authMiddleware, requireRole(["admin", "editor", "viewer"]), getBoardActivity);
router.get("/:id/search", authMiddleware, requireRole(["admin", "editor", "viewer"]), searchBoardCards);

router.get("/:id/invite-link", authMiddleware, requireRole(["admin", "editor"]), generateInviteLink);
router.post("/:id/invite-link/reset", authMiddleware, requireRole(["admin", "editor"]), resetInviteLink);
router.post("/join/:token", authMiddleware, joinViaLink); // Joining does not check active workspace roles since you're new!
router.post("/:id/invite-email", authMiddleware, requireRole(["admin"]), sendInviteEmail);

// Targeted Individual invitations management
router.post("/:id/invitations", authMiddleware, requireRole(["admin"]), createInvitation);
router.get("/:id/invitations", authMiddleware, requireRole(["admin", "editor", "viewer"]), getInvitations);
router.delete("/:id/invitations/:inviteId", authMiddleware, requireRole(["admin"]), revokeInvitation);
router.post("/:id/invitations/:inviteId/resend", authMiddleware, requireRole(["admin"]), resendInvitation);

// Workflow Automation rules management
router.get("/:id/automations", authMiddleware, requireRole(["admin", "editor", "viewer"]), getAutomations);
router.post("/:id/automations", authMiddleware, requireRole(["admin", "editor"]), createAutomation);
router.put("/:id/automations/:automationId", authMiddleware, requireRole(["admin", "editor"]), toggleAutomation);
router.delete("/:id/automations/:automationId", authMiddleware, requireRole(["admin", "editor"]), deleteAutomation);

export default router;