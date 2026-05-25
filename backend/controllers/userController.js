import User from "../models/User.js";
import Card from "../models/Card.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";

/**
 * Retrieves the profile and statistical data for the currently authenticated user.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the user profile and stats are successfully sent.
 */
export const getProfile = asyncHandler(async (req, res) => {
  // Exclude the password field to prevent sensitive data exposure
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new Error("User not found");
  
  // Retrieve all cards where the user is listed as an assignee
  const assignedCards = await Card.find({ assignees: req.user.id });
  const total = assignedCards.length;
  // Calculate the number of high-priority tasks assigned to the user
  const highPriority = assignedCards.filter(c => c.priority === "high").length;
  
  // Compile basic efficiency and productivity statistics for the dashboard
  const stats = {
    totalTasks: total,
    highPriorityTasks: highPriority,
    joinedAt: user.createdAt
  };

  return successResponse(res, { user, stats });
});

/**
 * Updates the user's profile details including name, email, avatar, and password.
 * 
 * @param {Object} req - The Express request object containing the profile update payload.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the updated profile is sent back.
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, avatar, password } = req.body;
  const user = await User.findById(req.user.id);

  // Selectively apply updates based on the provided fields
  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;
  
  // Securely hash the new password if it is being updated
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();
  
  // Strip the password before returning the updated user object to the client
  const updatedUser = user.toObject();
  delete updatedUser.password;

  return successResponse(res, updatedUser, "Profile updated successfully");
});

/**
 * Aggregates all file attachments from cards the user has access to across all boards.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the extracted asset metadata is returned.
 */
export const getUserAssets = asyncHandler(async (req, res) => {
  // Retrieve all cards that have at least one attachment, populated with their parent board data
  const cards = await Card.find({ "attachments.0": { $exists: true } })
    .populate({
      path: "listId",
      populate: { path: "boardId" }
    });

  const assets = [];
  cards.forEach(card => {
    const board = card.listId?.boardId;
    
    // Ensure the current user has read permissions for the board containing the asset
    if (board && (board.owner.toString() === req.user.id || board.members.includes(req.user.id))) {
      card.attachments.forEach(asset => {
        // Flatten and contextualize the attachment data for the asset library view
        assets.push({
          ...asset.toObject(),
          cardId: card._id,
          cardTitle: card.title,
          boardId: board._id,
          boardTitle: board.title
        });
      });
    }
  });

  return successResponse(res, assets);
});
