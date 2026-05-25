/**
 * @fileoverview Mongoose model for board Automations.
 * This model defines rule-based triggers and actions to automate
 * repetitive tasks on a specific board.
 */
import mongoose from "mongoose";

/**
 * Automation Schema definition.
 * Associates a specific trigger condition with an automated action.
 */
const automationSchema = new mongoose.Schema({
  // The board this automation rule belongs to.
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
  // A descriptive name for the automation rule (e.g., "Move to QA when completed").
  name: { type: String, required: true },
  // Defines the event that will trigger this automation.
  trigger: {
    type: { type: String, enum: ["CARD_MOVED", "CHECKLIST_COMPLETED"], required: true },
    targetListId: { type: String }, // Target list ID where card is moved (applicable for CARD_MOVED)
    metadata: mongoose.Schema.Types.Mixed // Flexible storage for future trigger conditions
  },
  // Defines the automated operation to execute when the trigger occurs.
  action: {
    type: { type: String, enum: ["MOVE_CARD", "ASSIGN_USER", "SET_PRIORITY"], required: true },
    targetListId: { type: String }, // Target list ID to move the card to (applicable for MOVE_CARD)
    assigneeId: { type: String },   // User ID to assign to the card (applicable for ASSIGN_USER)
    priority: { type: String },     // Priority level to set: "high", "medium", "low" (applicable for SET_PRIORITY)
    metadata: mongoose.Schema.Types.Mixed // Flexible storage for future action configurations
  },
  // Allows users to temporarily disable an automation without deleting it.
  active: { type: Boolean, default: true }
}, { timestamps: true });

/**
 * Automation model for the database.
 * @module models/Automation
 */
export default mongoose.model("Automation", automationSchema);
