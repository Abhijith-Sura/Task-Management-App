/**
 * @fileoverview Mongoose model for Boards.
 * Boards serve as the primary container for lists, cards, and team collaboration
 * within a specific workspace.
 */
import mongoose from "mongoose";

/**
 * Board Schema definition.
 */
const boardSchema = new mongoose.Schema({
  // The display name of the board.
  title: {
    type: String,
    required: [true, "Board title is required"],
    trim: true,
  },
  // The workspace that owns this board. Used for organizational grouping.
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  // The user who created or currently manages the board. Grants administrative privileges.
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // Users who have been granted access to view and interact with this board.
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  // A unique token used to generate shareable invitation links.
  inviteToken: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple boards to have no invite token without throwing unique constraint errors
  },
  // Optional grouping field to organize boards within a workspace.
  category: {
    type: String,
    default: "General",
    trim: true
  }
}, {
  timestamps: true,
  // Ensure virtual fields are included when converting documents to JSON or Objects
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual property to establish a one-to-many relationship with Lists.
 * This allows populating the board's lists without storing an array of ObjectIds on the board document.
 */
boardSchema.virtual("lists", {
  ref: "List",
  localField: "_id",
  foreignField: "boardId",
});

/**
 * Board model for the database.
 * @module models/Board
 */
export default mongoose.model("Board", boardSchema);