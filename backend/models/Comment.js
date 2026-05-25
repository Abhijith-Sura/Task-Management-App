/**
 * @fileoverview Comment model for the task management application.
 * Defines the schema and model for comments left by users on specific cards.
 */
import mongoose from "mongoose";

/**
 * @typedef {Object} Comment
 * @property {mongoose.Types.ObjectId} cardId - The card this comment belongs to
 * @property {mongoose.Types.ObjectId} userId - The user who created the comment
 * @property {string} text - The content of the comment
 * @property {Date} createdAt - Automatically generated timestamp of creation
 * @property {Date} updatedAt - Automatically generated timestamp of last update
 */

/**
 * Mongoose schema for the Comment model.
 * @type {mongoose.Schema}
 */
const commentSchema = new mongoose.Schema({
  // Reference to the parent Card this comment is attached to
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card",
    required: true,
  },
  // Reference to the User who authored the comment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // The actual text content of the comment
  text: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

/**
 * The Comment model instance.
 * @type {mongoose.Model}
 */
export default mongoose.model("Comment", commentSchema);
