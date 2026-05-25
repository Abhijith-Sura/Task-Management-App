import mongoose from "mongoose";

/**
 * Mongoose schema representing a list of cards within a board.
 * Each list acts as a vertical column to organize cards by status, category, or workflow stage.
 *
 * @typedef {mongoose.Schema} ListSchema
 */
const listSchema = new mongoose.Schema({
  /**
   * The display name of the list.
   * Required for rendering the list header in the UI.
   */
  title: {
    type: String,
    required: [true, "List title is required"],
    trim: true,
  },
  /**
   * Reference to the parent board that contains this list.
   * Establishes a one-to-many relationship between boards and lists.
   */
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  }
}, {
  // Ensure virtual fields are included when converting documents to JSON or plain objects
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Virtual property for retrieving all cards associated with this list.
 * This does not persist in the database but allows population queries to fetch nested cards.
 */
listSchema.virtual("cards", {
  ref: "Card",
  localField: "_id",
  foreignField: "listId",
});

/**
 * Mongoose model for the List collection.
 * 
 * @module models/List
 */
export default mongoose.model("List", listSchema);