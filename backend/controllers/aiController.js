import aiService from "../services/aiService.js";
import Card from "../models/Card.js";
import Activity from "../models/Activity.js";
import List from "../models/List.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { broadcastToBoard } from "../sockets/socketHandler.js";

/**
 * Generates checklist items for a card automatically using AI.
 * Automates task breakdown, updates the card, logs the activity, and broadcasts changes in real-time.
 * 
 * @route   POST /api/ai/generate-subtasks
 * @param {import("express").Request} req - The Express request object containing `cardId` in the body.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the populated card or an error response.
 */
export const generateSubtasks = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return errorResponse(res, "Card ID is required", 400);
  }

  // Delegate the generation of subtask strings to the AI service
  const subtaskStrings = await aiService.generateSubtasks(cardId);
  const card = await Card.findById(cardId);
  if (!card) {
    return errorResponse(res, "Card not found", 404);
  }

  // Format the raw AI output strings into structured checklist items
  const formattedItems = subtaskStrings.map(text => ({
    text,
    completed: false
  }));

  card.checklists.push(...formattedItems);
  await card.save();

  // Populate related card fields to return a comprehensive response
  const populatedCard = await Card.findById(cardId)
    .populate("assignees", "name avatar")
    .populate("listId", "title");

  // Retrieve boardId for activity logging and targeted socket broadcasts
  const list = await List.findById(card.listId).select("boardId").lean();
  const boardId = list?.boardId;

  if (boardId) {
    // Record this automation event in the board's activity log
    await Activity.create({
      action: `✨ AI Autopilot generated ${formattedItems.length} checklist items for "${card.title}"`,
      type: "AUTOMATION",
      cardId: card._id,
      boardId: boardId,
      user: req.user?.id
    });

    // Notify other viewers immediately to keep the board state synchronized across clients
    broadcastToBoard(boardId, "update-card", populatedCard);
    broadcastToBoard(boardId, "board-refresh", { boardId });
  }

  return successResponse(res, populatedCard, "AI checklist subtasks appended successfully");
});

/**
 * Summarizes the comment thread discussion on a specific card using AI.
 * Condenses lengthy conversations into a concise overview for quick reading.
 * 
 * @route   POST /api/ai/summarize-discussion
 * @param {import("express").Request} req - The Express request object containing `cardId` in the body.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the generated discussion summary.
 */
export const summarizeDiscussion = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return errorResponse(res, "Card ID is required", 400);
  }

  const summary = await aiService.summarizeDiscussion(cardId);
  return successResponse(res, { summary }, "AI comment thread summary generated successfully");
});
