import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";

/**
 * @desc    Get the active workspace ID for any request resource parameters dynamically
 */
const resolveWorkspaceId = async (req) => {
  const { id, workspaceId, boardId, listId, cardId } = req.params;

  // 1. Direct workspace parameters
  if (workspaceId) return workspaceId;
  
  // Check if req.originalUrl is /api/workspaces/:id
  if (req.originalUrl.includes("/api/workspaces") && id) {
    return id;
  }

  // 2. Direct board parameters
  if (boardId) {
    const board = await Board.findById(boardId).select("workspaceId").lean();
    if (board) return board.workspaceId;
  }
  if (req.originalUrl.includes("/api/boards") && id) {
    const board = await Board.findById(id).select("workspaceId").lean();
    if (board) return board.workspaceId;
  }

  // 3. Direct list parameters
  if (listId) {
    const list = await List.findById(listId).select("boardId").lean();
    if (list) {
      const board = await Board.findById(list.boardId).select("workspaceId").lean();
      if (board) return board.workspaceId;
    }
  }
  if (req.originalUrl.includes("/api/lists") && id) {
    const list = await List.findById(id).select("boardId").lean();
    if (list) {
      const board = await Board.findById(list.boardId).select("workspaceId").lean();
      if (board) return board.workspaceId;
    }
  }

  // 4. Direct card parameters
  if (cardId) {
    const card = await Card.findById(cardId).select("listId").lean();
    if (card) {
      const list = await List.findById(card.listId).select("boardId").lean();
      if (list) {
        const board = await Board.findById(list.boardId).select("workspaceId").lean();
        if (board) return board.workspaceId;
      }
    }
  }
  if (req.originalUrl.includes("/api/cards") && id) {
    const card = await Card.findById(id).select("listId").lean();
    if (card) {
      const list = await List.findById(card.listId).select("boardId").lean();
      if (list) {
        const board = await Board.findById(list.boardId).select("workspaceId").lean();
        if (board) return board.workspaceId;
      }
    }
  }

  // Fallback checks from request body
  if (req.body.workspaceId) return req.body.workspaceId;
  if (req.body.boardId) {
    const board = await Board.findById(req.body.boardId).select("workspaceId").lean();
    if (board) return board.workspaceId;
  }
  if (req.body.listId) {
    const list = await List.findById(req.body.listId).select("boardId").lean();
    if (list) {
      const board = await Board.findById(list.boardId).select("workspaceId").lean();
      if (board) return board.workspaceId;
    }
  }

  return null;
};

/**
 * @desc    Middleware to verify workspace permissions based on roles
 */
export const requireRole = (allowedRoles) => async (req, res, next) => {
  try {
    const workspaceId = await resolveWorkspaceId(req);
    if (!workspaceId) {
      // If we cannot resolve workspace context, proceed to regular validations
      return next();
    }

    const workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      // Workspace was deleted but board still references it -- fall through
      // so the controller can handle the missing resource gracefully
      return next();
    }

    // Owner gets absolute admin access
    if (workspace.owner.toString() === req.user.id.toString()) {
      req.user.workspaceRole = "admin";
      return next();
    }

    // Find user role in workspace members list
    const member = workspace.members.find(m => m.user && m.user.toString() === req.user.id.toString());
    if (!member) {
      return res.status(403).json({ success: false, message: "Access Denied: You are not a member of this workspace" });
    }

    req.user.workspaceRole = member.role;

    if (!allowedRoles.includes(member.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access Denied: Action requires ${allowedRoles.join(" or ")} role. Your role is ${member.role}.` 
      });
    }

    next();
  } catch (error) {
    console.error("🔒 RBAC_MIDDLEWARE_ERROR:", error);
    res.status(500).json({ success: false, message: "Internal server error during role validation" });
  }
};
