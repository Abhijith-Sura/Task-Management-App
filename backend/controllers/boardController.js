import boardService from "../services/boardService.js";
import automationService from "../services/automationService.js";
import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import List from "../models/List.js";
import Card from "../models/Card.js";
import { broadcastToBoard } from "../sockets/socketHandler.js";

/**
 * Creates a new board for the authenticated user.
 * 
 * @route   POST /api/boards
 * @param {import("express").Request} req - The Express request object containing board details.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the newly created board.
 */
export const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.createBoard(req.body, req.user.id);
  return successResponse(res, board, "Board created successfully", 201);
});

/**
 * Creates a new board by instantiating an enterprise template configuration.
 * 
 * @route   POST /api/boards/create-from-template
 * @param {import("express").Request} req - The Express request object containing template configuration data.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the configured board.
 */
export const createBoardFromTemplate = asyncHandler(async (req, res) => {
  const board = await boardService.createBoardFromTemplate(req.body, req.user.id);
  return successResponse(res, board, "Board created from template successfully", 201);
});

/**
 * Retrieves all boards accessible to the currently authenticated user.
 * 
 * @route   GET /api/boards
 * @param {import("express").Request} req - The Express request object.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with a list of boards.
 */
export const getBoards = asyncHandler(async (req, res) => {
  const boards = await boardService.getUserBoards(req.user.id);
  return successResponse(res, boards);
});

/**
 * Retrieves the complete hierarchy of a board, including its lists and cards.
 * 
 * @route   GET /api/boards/:id
 * @param {import("express").Request} req - The Express request object containing the board `id` parameter.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the detailed board structure.
 */
export const getBoardDetail = asyncHandler(async (req, res) => {
  const board = await boardService.getBoardDetails(req.params.id);
  return successResponse(res, board);
});

/**
 * Updates properties of an existing board, such as title or visibility.
 * 
 * @route   PUT /api/boards/:id
 * @param {import("express").Request} req - The Express request object containing updated properties.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the updated board.
 */
export const updateBoard = asyncHandler(async (req, res) => {
  const board = await boardService.updateBoard(req.params.id, req.body);
  return successResponse(res, board, "Board updated successfully");
});

/**
 * Invites a new member to the board via their email address.
 * Dispatches an invitation email if the user does not currently exist.
 * 
 * @route   POST /api/boards/invite
 * @param {import("express").Request} req - The Express request object containing `boardId` and `email`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming the addition or dispatched invitation.
 */
export const inviteMember = asyncHandler(async (req, res) => {
  const { boardId, email } = req.body;
  const origin = req.get("origin") || req.headers.origin;
  const board = await boardService.inviteMember(boardId, email, req.user.id, origin);
  if (board) {
    return successResponse(res, board, "Member added to board successfully");
  }
  return successResponse(res, null, "Invitation email sent to unregistered user");
});

/**
 * Deletes a board and its associated cascading resources (lists, cards, activities).
 * 
 * @route   DELETE /api/boards/:id
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response indicating completion.
 */
export const deleteBoard = asyncHandler(async (req, res) => {
  await boardService.deleteBoard(req.params.id);
  return successResponse(res, null, "Board deleted successfully");
});

/**
 * Retrieves the activity log (audit trail) for a specific board.
 * 
 * @route   GET /api/boards/:id/activity
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with a chronological list of board activities.
 */
export const getBoardActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ boardId: req.params.id })
    .populate("user", "name email avatar")
    .sort("-createdAt")
    .limit(100);
  return successResponse(res, activities);
});

/**
 * Generates a sharable invitation link for a board.
 * 
 * @route   GET /api/boards/:id/invite-link
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response containing the generated invite link token.
 */
export const generateInviteLink = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const result = await boardService.generateInviteLink(req.params.id, req.user.id, origin);
  return successResponse(res, result);
});

/**
 * Revokes an existing invitation link and generates a fresh one, securing the board from unauthorized access.
 * 
 * @route   POST /api/boards/:id/invite-link/reset
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the new invite link details.
 */
export const resetInviteLink = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const result = await boardService.resetInviteLink(req.params.id, req.user.id, origin);
  return successResponse(res, result, "Invite link reset successfully");
});

/**
 * Joins a board using a valid invitation link token.
 * 
 * @route   POST /api/boards/join/:token
 * @param {import("express").Request} req - The Express request object containing the invitation `token`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming the user has joined the board.
 */
export const joinViaLink = asyncHandler(async (req, res) => {
  const result = await boardService.joinViaLink(req.params.token, req.user.id);
  return successResponse(res, result, "Joined board successfully");
});

/**
 * Dispatches a standard invitation email to an external user.
 * 
 * @route   POST /api/boards/:id/invite-email
 * @param {import("express").Request} req - The Express request object containing `email` and the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If `email` is not provided.
 * @returns {Promise<void>} Sends a success response confirming email dispatch.
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
 * Creates a gated, specific invitation assigning a role to a target user.
 * 
 * @route   POST /api/boards/:id/invitations
 * @param {import("express").Request} req - The Express request object containing `email`, `role`, and board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If `email` is missing.
 * @returns {Promise<void>} Sends a success response with the created invitation entity.
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
 * Retrieves all pending invitations issued for a specific board.
 * 
 * @route   GET /api/boards/:id/invitations
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with an array of active invitations.
 */
export const getInvitations = asyncHandler(async (req, res) => {
  const invitations = await boardService.getInvitations(req.params.id);
  return successResponse(res, invitations);
});

/**
 * Revokes a pending invitation before the target user can accept it.
 * Broadcasts the revocation event to board viewers.
 * 
 * @route   DELETE /api/boards/:id/invitations/:inviteId
 * @param {import("express").Request} req - The Express request object containing `inviteId` and board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming the invitation was revoked.
 */
export const revokeInvitation = asyncHandler(async (req, res) => {
  const invite = await boardService.revokeInvitation(req.params.inviteId, req.user.id);
  broadcastToBoard(invite.boardId, "board-refresh", { boardId: invite.boardId });
  return successResponse(res, invite, "Invitation revoked successfully");
});

/**
 * Resends an existing invitation email to the target recipient.
 * 
 * @route   POST /api/boards/:id/invitations/:inviteId/resend
 * @param {import("express").Request} req - The Express request object containing `inviteId` and board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming the email was resent.
 */
export const resendInvitation = asyncHandler(async (req, res) => {
  const origin = req.get("origin") || req.headers.origin;
  const invite = await boardService.resendInvitation(req.params.inviteId, req.user.id, origin);
  return successResponse(res, invite, "Invitation email resent successfully");
});

/**
 * Processes a user's acceptance of an invitation token, appending them to the board.
 * Broadcasts the updated board membership state to all connected clients.
 * 
 * @route   POST /api/boards/invitations/accept/:token
 * @param {import("express").Request} req - The Express request object containing the invitation `token`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response indicating the user has been added.
 */
export const acceptInvitation = asyncHandler(async (req, res) => {
  const result = await boardService.acceptInvitation(req.params.token, req.user.id);
  broadcastToBoard(result.boardId, "board-refresh", { boardId: result.boardId });
  return successResponse(res, result, "Invitation accepted successfully");
});

/**
 * Retrieves all configured automation rules mapped to a specific board.
 * 
 * @route   GET /api/boards/:id/automations
 * @param {import("express").Request} req - The Express request object containing the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with an array of automation rules.
 */
export const getAutomations = asyncHandler(async (req, res) => {
  const automations = await automationService.getAutomations(req.params.id);
  return successResponse(res, automations);
});

/**
 * Defines and persists a new automation rule for a board.
 * 
 * @route   POST /api/boards/:id/automations
 * @param {import("express").Request} req - The Express request object containing the board `id` and rule definitions.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the registered automation rule.
 */
export const createAutomation = asyncHandler(async (req, res) => {
  const automation = await automationService.createAutomation(req.params.id, req.body);
  return successResponse(res, automation, "Automation rule created successfully", 201);
});

/**
 * Toggles the operational state (active/inactive) of an automation rule.
 * 
 * @route   PUT /api/boards/:id/automations/:automationId
 * @param {import("express").Request} req - The Express request object containing `automationId` and target `active` state.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the updated automation record.
 */
export const toggleAutomation = asyncHandler(async (req, res) => {
  const { active } = req.body;
  const automation = await automationService.toggleAutomation(req.params.automationId, active);
  return successResponse(res, automation, "Automation rule status updated");
});

/**
 * Removes an existing automation rule from a board.
 * 
 * @route   DELETE /api/boards/:id/automations/:automationId
 * @param {import("express").Request} req - The Express request object containing the `automationId`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming deletion.
 */
export const deleteAutomation = asyncHandler(async (req, res) => {
  await automationService.deleteAutomation(req.params.automationId);
  return successResponse(res, null, "Automation rule deleted successfully");
});

/**
 * Performs a faceted search across a board's cards and aggregates distribution statistics
 * (priority, tags, assignees) for analytics rendering.
 * 
 * @route   GET /api/boards/:id/search
 * @param {import("express").Request} req - The Express request object containing search queries and the board `id`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response detailing matching cards and metadata aggregations.
 */
export const searchBoardCards = asyncHandler(async (req, res) => {
  const boardId = req.params.id;
  const { q, priority, assigneeId, label } = req.query;

  // Retrieve all internal list identifiers mapped to the target board for querying nested cards
  const lists = await List.find({ boardId }).select("_id").lean();
  const listIds = lists.map(l => l._id);

  // Short-circuit execution if the board has no constituent lists
  if (listIds.length === 0) {
    return successResponse(res, {
      cards: [],
      priorityDistribution: [],
      tagDistribution: [],
      assigneeDistribution: []
    });
  }

  // Construct a baseline MongoDB match query constrained by the identified board lists
  const matchQuery = { listId: { $in: listIds } };

  // Append optional search criteria based on user input
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

  // Execute a robust multifaceted aggregation pipeline combining filtered card retrieval
  // with parallel statistical generation streams used for front-end charts and filtering UI.
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

  // Extract the facet document, safely falling back to empty representations if devoid of matches
  const result = aggregationResult[0] || {
    cards: [],
    priorityDistribution: [],
    tagDistribution: [],
    assigneeDistribution: []
  };

  return successResponse(res, result);
});