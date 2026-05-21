import boardService from "../services/boardService.js";
import automationService from "../services/automationService.js";
import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import List from "../models/List.js";
import Card from "../models/Card.js";

/**
 * @desc    Create a new board
 * @route   POST /api/boards
 */
export const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.createBoard(req.body, req.user.id);
  return successResponse(res, board, "Board created successfully", 201);
});

/**
 * @desc    Create a new board from an enterprise template config
 * @route   POST /api/boards/create-from-template
 */
export const createBoardFromTemplate = asyncHandler(async (req, res) => {
  const board = await boardService.createBoardFromTemplate(req.body, req.user.id);
  return successResponse(res, board, "Board created from template successfully", 201);
});

/**
 * @desc    Get all boards for current user
 * @route   GET /api/boards
 */
export const getBoards = asyncHandler(async (req, res) => {
  const boards = await boardService.getUserBoards(req.user.id);
  return successResponse(res, boards);
});

/**
 * @desc    Get full board details (lists & cards)
 * @route   GET /api/boards/:id
 */
export const getBoardDetail = asyncHandler(async (req, res) => {
  const board = await boardService.getBoardDetails(req.params.id);
  return successResponse(res, board);
});

/**
 * @desc    Update board (rename, etc.)
 * @route   PUT /api/boards/:id
 */
export const updateBoard = asyncHandler(async (req, res) => {
  const board = await boardService.updateBoard(req.params.id, req.body);
  return successResponse(res, board, "Board updated successfully");
});

/**
 * @desc    Invite member to board
 * @route   POST /api/boards/invite
 */
export const inviteMember = asyncHandler(async (req, res) => {
  const { boardId, email } = req.body;
  const board = await boardService.inviteMember(boardId, email);
  return successResponse(res, board, "Member invited successfully");
});

/**
 * @desc    Delete board
 * @route   DELETE /api/boards/:id
 */
export const deleteBoard = asyncHandler(async (req, res) => {
  await boardService.deleteBoard(req.params.id);
  return successResponse(res, null, "Board deleted successfully");
});

/**
 * @desc    Get activity log for a board
 * @route   GET /api/boards/:id/activity
 */
export const getBoardActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ boardId: req.params.id })
    .populate("user", "name email avatar")
    .sort("-createdAt")
    .limit(100);
  return successResponse(res, activities);
});

/**
 * @desc    Generate Invite Link
 * @route   GET /api/boards/:id/invite-link
 */
export const generateInviteLink = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const result = await boardService.generateInviteLink(req.params.id, req.user.id, origin);
  return successResponse(res, result);
});

/**
 * @desc    Reset and Revoke Invite Link
 * @route   POST /api/boards/:id/invite-link/reset
 */
export const resetInviteLink = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const result = await boardService.resetInviteLink(req.params.id, req.user.id, origin);
  return successResponse(res, result, "Invite link reset successfully");
});

/**
 * @desc    Join Board via Link
 * @route   POST /api/boards/join/:token
 */
export const joinViaLink = asyncHandler(async (req, res) => {
  const result = await boardService.joinViaLink(req.params.token, req.user.id);
  return successResponse(res, result, "Joined board successfully");
});

/**
 * @desc    Send Invite Email
 * @route   POST /api/boards/:id/invite-email
 */
export const sendInviteEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new Error("Please provide an email to invite");
  }
  const origin = req.get("origin") || req.headers.origin;
  const result = await boardService.sendInviteEmail(req.params.id, email, req.user.id, origin);
  return successResponse(res, result);
});

/**
 * @desc    Create Gated Invitation
 * @route   POST /api/boards/:id/invitations
 */
export const createInvitation = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  if (!email) {
    throw new Error("Please provide a target email address");
  }
  const origin = req.get("origin") || req.headers.origin;
  const invitation = await boardService.createInvitation(req.params.id, email, role, req.user.id, origin);
  return successResponse(res, invitation, "Targeted invitation sent successfully");
});

/**
 * @desc    Get Pending Invitations
 * @route   GET /api/boards/:id/invitations
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const invitations = await boardService.getInvitations(req.params.id);
  return successResponse(res, invitations);
});

/**
 * @desc    Revoke Invitation
 * @route   DELETE /api/boards/:id/invitations/:inviteId
 */
export const revokeInvitation = asyncHandler(async (req, res) => {
  const invite = await boardService.revokeInvitation(req.params.inviteId, req.user.id);
  return successResponse(res, invite, "Invitation revoked successfully");
});

/**
 * @desc    Resend Invitation Email
 * @route   POST /api/boards/:id/invitations/:inviteId/resend
 */
export const resendInvitation = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const invite = await boardService.resendInvitation(req.params.inviteId, req.user.id, origin);
  return successResponse(res, invite, "Invitation email resent successfully");
});

/**
 * @desc    Accept Invitation
 * @route   POST /api/boards/invitations/accept/:token
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await boardService.acceptInvitation(req.params.token, req.user.id);
  return successResponse(res, result, "Invitation accepted successfully");
});

/**
 * @desc    Get Automations for Board
 * @route   GET /api/boards/:id/automations
 */
export const getAutomations = asyncHandler(async (req, res) => {
  const automations = await automationService.getAutomations(req.params.id);
  return successResponse(res, automations);
});

/**
 * @desc    Create Automation Rule
 * @route   POST /api/boards/:id/automations
 */
export const createAutomation = asyncHandler(async (req, res) => {
  const automation = await automationService.createAutomation(req.params.id, req.body);
  return successResponse(res, automation, "Automation rule created successfully", 201);
});

/**
 * @desc    Toggle Automation Rule
 * @route   PUT /api/boards/:id/automations/:automationId
 */
export const toggleAutomation = asyncHandler(async (req, res) => {
  const { active } = req.body;
  const automation = await automationService.toggleAutomation(req.params.automationId, active);
  return successResponse(res, automation, "Automation rule status updated");
});

/**
 * @desc    Delete Automation Rule
 * @route   DELETE /api/boards/:id/automations/:automationId
 */
export const deleteAutomation = asyncHandler(async (req, res) => {
  await automationService.deleteAutomation(req.params.automationId);
  return successResponse(res, null, "Automation rule deleted successfully");
});

/**
 * @desc    Faceted board search and statistics aggregator
 * @route   GET /api/boards/:id/search
 */
export const searchBoardCards = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { q, priority, assigneeId, label } = req.query;

  // 1. Get all lists on this board
  const lists = await List.find({ boardId }).select("_id").lean();
  const listIds = lists.map(l => l._id);

  if (listIds.length === 0) {
    return successResponse(res, {
      cards: [],
      priorityDistribution: [],
      tagDistribution: [],
      assigneeDistribution: []
    });
  }

  // 2. Build match queries
  const matchQuery = { listId: { $in: listIds } };

  if (q) {
    matchQuery.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ];
  }

  if (priority) {
    matchQuery.priority = priority.toLowerCase();
  }

  if (assigneeId) {
    matchQuery.assignees = new mongoose.Types.ObjectId(assigneeId);
  }

  if (label) {
    matchQuery["labels.text"] = { $regex: label, $options: "i" };
  }

  // 3. Execute faceted aggregation
  const aggregationResult = await Card.aggregate([
    { $match: matchQuery },
    {
      $facet: {
        cards: [
          { $sort: { position: 1 } },
          {
            $lookup: {
              from: "users",
              localField: "assignees",
              foreignField: "_id",
              as: "assigneeDetails"
            }
          },
          {
            $lookup: {
              from: "lists",
              localField: "listId",
              foreignField: "_id",
              as: "listDetails"
            }
          }
        ],
        priorityDistribution: [
          { $group: { _id: "$priority", count: { $sum: 1 } } }
        ],
        tagDistribution: [
          { $unwind: "$labels" },
          { $group: { _id: "$labels.text", count: { $sum: 1 } } }
        ],
        assigneeDistribution: [
          { $unwind: "$assignees" },
          { $group: { _id: "$assignees", count: { $sum: 1 } } }
        ]
      }
    }
  ]);

  const result = aggregationResult[0] || {
    cards: [],
    priorityDistribution: [],
    tagDistribution: [],
    assigneeDistribution: []
  };

  return successResponse(res, result);
});