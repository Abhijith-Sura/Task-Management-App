import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  action: {
    type: String
  },
  type: {
    type: String,
    enum: ["CREATE", "UPDATE", "MOVE", "DELETE", "COMMENT", "ATTACHMENT", "AUTOMATION"],
    default: "UPDATE"
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card"
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board"
  }
}, { timestamps: true });

export default mongoose.model("Activity", activitySchema);