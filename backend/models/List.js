import mongoose from "mongoose";

const listSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "List title is required"],
    trim: true,
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for cards belonging to this list
listSchema.virtual("cards", {
  ref: "Card",
  localField: "_id",
  foreignField: "listId",
});

export default mongoose.model("List", listSchema);