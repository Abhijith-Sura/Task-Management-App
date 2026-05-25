import cardService from "../services/cardService.js";
import Card from "../models/Card.js";
import Activity from "../models/Activity.js";
import Comment from "../models/Comment.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";
import sendEmail from "../utils/sendEmail.js";

/**
 * Creates a new task card within a specific list.
 *
 * @desc    Create a new card
 * @route   POST /api/cards
 * @param   {import('express').Request} req - The Express request object containing card details in the body.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const createCard = asyncHandler(async (req, res) => {
  const card = await cardService.createCard(req.body, req.user?.id);
  return successResponse(res, card, "Card created successfully", 201);
});

/**
 * Updates an existing card's details such as title, description, or due date.
 *
 * @desc    Update card details
 * @route   PUT /api/cards/:cardId
 * @param   {import('express').Request} req - The Express request object containing updated fields in the body.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const updateCard = asyncHandler(async (req, res) => {
  const card = await cardService.updateCard(req.params.cardId, req.body, req.user?.id);
  return successResponse(res, card, "Card updated successfully");
});

/**
 * Moves a card to a different list or a new position within the same list.
 *
 * @desc    Move card (list or position)
 * @route   PUT /api/cards/move
 * @param   {import('express').Request} req - The Express request object containing the card ID, target list ID, and new position.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const moveCard = asyncHandler(async (req, res) => {
  // Extract positional metadata required to reorder or transfer the card
  const { cardId, newListId, newPosition } = req.body;
  const card = await cardService.moveCard(cardId, newListId, newPosition, req.user?.id);
  return successResponse(res, card, "Card moved successfully");
});

/**
 * Uploads and attaches a file to a specific card.
 *
 * @desc    Upload attachment to card
 * @route   POST /api/cards/upload
 * @param   {import('express').Request} req - The Express request object containing the uploaded file and card ID.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const uploadAttachment = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  if (!req.file) {
    return errorResponse(res, "No file uploaded", 400);
  }

  // Construct file metadata object based on the uploaded file from multer
  const fileData = {
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
    size: req.file.size,
    mimeType: req.file.mimetype
  };

  const card = await cardService.addAttachment(cardId, fileData, req.user?.id);
  return successResponse(res, card, "Attachment uploaded successfully");
});

/**
 * Retrieves the activity history and audit logs for a specific card.
 *
 * @desc    Get activity for a specific card
 * @route   GET /api/cards/:cardId/activity
 * @param   {import('express').Request} req - The Express request object containing the card ID.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const getCardActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ cardId: req.params.cardId })
    .populate("user", "name email avatar")
    .sort("-createdAt")
    .limit(50);
  return successResponse(res, activities);
});

/**
 * Adds a new comment to a card and sends email notifications to assignees.
 *
 * @desc    Add comment to card
 * @route   POST /api/cards/:cardId/comments
 * @param   {import('express').Request} req - The Express request object containing the comment text.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const addComment = asyncHandler(async (req, res) => {
  const comment = await Comment.create({
    cardId: req.params.cardId,
    userId: req.user.id,
    text: req.body.text
  });
  
  // Populate the user data to immediately display commenter details on the frontend
  const populatedComment = await comment.populate("userId", "name email avatar");
  
  // Create an audit trail log for the newly added comment
  const card = await Card.findById(req.params.cardId).populate("assignees", "name email");
  await cardService.logActivity(req.user.id, `Commented on "${card?.title}"`, req.params.cardId, card?.listId);
  
  // Notify other assignees on the card, ensuring we don't email the commenter themselves
  if (card && card.assignees && card.assignees.length > 0) {
    const commenterName = populatedComment.userId?.name || "A collaborator";
    const otherAssignees = card.assignees.filter(a => a._id.toString() !== req.user.id.toString());
    
    // Dispatch emails asynchronously without blocking the primary request cycle
    for (const assignee of otherAssignees) {
      if (assignee.email) {
        sendEmail({
          email: assignee.email,
          subject: `💬 New Comment on: "${card.title}"`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #121214; color: #e2e8f0;">
              <h2 style="color: #3b82f6; margin-top: 0;">New Task Comment</h2>
              <p>Hi <strong>${assignee.name}</strong>,</p>
              <p><strong>${commenterName}</strong> left a new comment on a task you are assigned to:</p>
              <blockquote style="background-color: #1a1a1e; padding: 15px; border-left: 4px solid #3b82f6; border-radius: 4px; font-style: italic; color: #e2e8f0; margin: 15px 0; border-top: 1px solid #2d2d34; border-right: 1px solid #2d2d34; border-bottom: 1px solid #2d2d34;">
                "${comment.text}"
              </blockquote>
              <p style="margin-top: 20px;">Task: <strong>${card.title}</strong></p>
              <p style="font-size: 12px; color: #718096; text-align: center; margin-top: 30px;">
                This is an automated notification. Please visit your workspace to reply.
              </p>
            </div>
          `
        }).catch(err => console.error("Failed to send comment email:", err));
      }
    }
  }
  
  return successResponse(res, populatedComment, "Comment added", 201);
});

/**
 * Retrieves all comments associated with a specific card.
 *
 * @desc    Get comments for card
 * @route   GET /api/cards/:cardId/comments
 * @param   {import('express').Request} req - The Express request object containing the card ID.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const getComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ cardId: req.params.cardId })
    .populate("userId", "name email avatar")
    .sort("-createdAt");
  return successResponse(res, comments);
});

/**
 * Deletes a specific card and triggers cleanup of its associated resources.
 *
 * @desc    Delete a card
 * @route   DELETE /api/cards/:cardId
 * @param   {import('express').Request} req - The Express request object containing the card ID.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const deleteCard = asyncHandler(async (req, res) => {
  const cardId = req.params.cardId;
  await cardService.deleteCard(cardId, req.user.id);
  return successResponse(res, null, "Card deleted successfully");
});

/**
 * Retrieves all cards assigned to the currently authenticated user.
 *
 * @desc    Get cards assigned to current user
 * @route   GET /api/cards/mine
 * @param   {import('express').Request} req - The Express request object.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const getMyCards = asyncHandler(async (req, res) => {
  const cards = await Card.find({ assignees: req.user.id })
    .populate("listId", "title")
    .sort("-createdAt");
  return successResponse(res, cards);
});

/**
 * Performs a global search across all cards accessible to the user based on a query.
 *
 * @desc    Search cards across boards
 * @route   GET /api/cards/search
 * @param   {import('express').Request} req - The Express request object containing the search query `q`.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const results = await cardService.searchCards(q, req.user.id);
  return successResponse(res, results);
});