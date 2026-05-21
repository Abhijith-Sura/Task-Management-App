import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Board title is required"],
    trim: true,
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Workspace",
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  inviteToken: {
    type: String,
    unique: true,
    sparse: true,
  },
  category: {
    type: String,
    default: "General",
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for lists belonging to this board
boardSchema.virtual("lists", {
  ref: "List",
  localField: "_id",
  foreignField: "boardId",
});

export default mongoose.model("Board", boardSchema);