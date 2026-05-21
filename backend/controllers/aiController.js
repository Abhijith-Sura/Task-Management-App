import aiService from "../services/aiService.js";
import Card from "../models/Card.js";
import Activity from "../models/Activity.js";
import List from "../models/List.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import { broadcastToBoard } from "../sockets/socketHandler.js";

/**
 * @desc    Generate checklist items for card automatically via AI
 * @route   POST /api/ai/generate-subtasks
 */
export const generateSubtasks = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return errorResponse(res, "Card ID is required", 400);
  }

  const subtaskStrings = await aiService.generateSubtasks(cardId);
  const card = await Card.findById(cardId);
  if (!card) {
    return errorResponse(res, "Card not found", 404);
  }

  // Push new subtasks to checklist array
  const formattedItems = subtaskStrings.map(text => ({
    text,
    completed: false
  }));

  card.checklists.push(...formattedItems);
  await card.save();

  // Populate card details
  const populatedCard = await Card.findById(cardId)
    .populate("assignees", "name avatar")
    .populate("listId", "title");

  // Retrieve boardId for activity logging and socket broadcasts
  const list = await List.findById(card.listId).select("boardId").lean();
  const boardId = list?.boardId;

  if (boardId) {
    // Log dynamic activity
    await Activity.create({
      action: `✨ AI Autopilot generated ${formattedItems.length} checklist items for "${card.title}"`,
      type: "AUTOMATION",
      cardId: card._id,
      boardId: boardId,
      user: req.user?.id
    });

    // Notify other viewers immediately in real-time
    broadcastToBoard(boardId, "update-card", populatedCard);
    broadcastToBoard(boardId, "board-refresh", { boardId });
  }

  return successResponse(res, populatedCard, "AI checklist subtasks appended successfully");
});

/**
 * @desc    Summarize comment thread discussion via AI
 * @route   POST /api/ai/summarize-discussion
 */
export const summarizeDiscussion = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return errorResponse(res, "Card ID is required", 400);
  }

  const summary = await aiService.summarizeDiscussion(cardId);
  return successResponse(res, { summary }, "AI comment thread summary generated successfully");
});
