import mongoose from "mongoose";

const automationSchema = new mongoose.Schema({
  boardId: { type: mongoose.Schema.Types.ObjectId, ref: "Board", required: true },
  name: { type: String, required: true },
  trigger: {
    type: { type: String, enum: ["CARD_MOVED", "CHECKLIST_COMPLETED"], required: true },
    targetListId: { type: String }, // Target list ID where card is moved
    metadata: mongoose.Schema.Types.Mixed
  },
  action: {
    type: { type: String, enum: ["MOVE_CARD", "ASSIGN_USER", "SET_PRIORITY"], required: true },
    targetListId: { type: String }, // Target list ID to move the card to
    assigneeId: { type: String },   // User ID to assign to the card
    priority: { type: String },     // "high", "medium", "low"
    metadata: mongoose.Schema.Types.Mixed
  },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Automation", automationSchema);
