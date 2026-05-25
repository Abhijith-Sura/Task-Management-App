/**
 * @fileoverview Mongoose model for Activity logs.
 * This model tracks user actions and system events across the application,
 * providing an audit trail for changes to cards, boards, and other resources.
 */
import mongoose from "mongoose";

/**
 * Activity Schema definition.
 * Captures the 'who', 'what', 'when', and 'where' of an event.
 */
const activitySchema = new mongoose.Schema({
  // The user who performed the action. Optional for system-generated events (e.g., AUTOMATION).
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // A human-readable description of the action (e.g., "moved card to Done").
  action: {
    type: String
  },
  // The category of the activity, used for filtering and displaying icons/styles in the UI.
  type: {
    type: String,
    enum: ["CREATE", "UPDATE", "MOVE", "DELETE", "COMMENT", "ATTACHMENT", "AUTOMATION"],
    default: "UPDATE"
  },
  // Flexible payload for storing additional context (e.g., previous state, changed fields).
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  // The specific card this activity relates to, if applicable.
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card"
  },
  // The board where this activity occurred, used to scope activity feeds.
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board"
  }
}, { timestamps: true });

/**
 * Activity model for the database.
 * @module models/Activity
 */
export default mongoose.model("Activity", activitySchema);