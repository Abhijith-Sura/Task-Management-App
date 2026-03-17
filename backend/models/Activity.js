import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  action: {
    type: String
  },

  cardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Card"
  }

}, { timestamps: true });

export default mongoose.model("Activity", activitySchema);