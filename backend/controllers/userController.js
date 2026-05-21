import User from "../models/User.js";
import Card from "../models/Card.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";

/**
 * @desc    Get user profile and stats
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) throw new Error("User not found");
  
  // Aggregate stats
  const assignedCards = await Card.find({ assignees: req.user.id });
  const total = assignedCards.length;
  const highPriority = assignedCards.filter(c => c.priority === "high").length;
  
  // Simplified efficiency: based on cards created vs completed (if we had a status)
  // For now, let's just return what we have
  const stats = {
    totalTasks: total,
    highPriorityTasks: highPriority,
    joinedAt: user.createdAt
  };

  return successResponse(res, { user, stats });
});

/**
 * @desc    Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, avatar, password } = req.body;
  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (email) user.email = email;
  if (avatar) user.avatar = avatar;
  
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();
  
  const updatedUser = user.toObject();
  delete updatedUser.password;

  return successResponse(res, updatedUser, "Profile updated successfully");
});

/**
 * @desc    Get all files/assets for the user across all boards
 */
export const getUserAssets = asyncHandler(async (req, res) => {
  // Find all cards where user is an assignee OR owner of the board?
  // Let's keep it simple: All cards the user can see (i.e. boards they are members of)
  // Actually, let's just find all cards that have attachments
  // and then filter by board membership in the query
  const cards = await Card.find({ "attachments.0": { $exists: true } })
    .populate({
      path: "listId",
      populate: { path: "boardId" }
    });

  const assets = [];
  cards.forEach(card => {
    // Check if user has access to this board
    const board = card.listId?.boardId;
    if (board && (board.owner.toString() === req.user.id || board.members.includes(req.user.id))) {
      card.attachments.forEach(asset => {
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
