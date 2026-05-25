/**
 * @fileoverview Card model for the task management application.
 * Represents a single task or item within a list, containing detailed metadata,
 * assignments, checklists, and attachments.
 */
import mongoose from "mongoose";

/**
 * @typedef {Object} Card
 * @property {string} title - The display title of the card
 * @property {string} description - Detailed description or notes for the task
 * @property {mongoose.Types.ObjectId} listId - The list this card belongs to
 * @property {number} position - Ordering position within the parent list
 * @property {string} priority - Importance level (low, medium, high)
 * @property {Date} startDate - When work on the task should begin
 * @property {Date} dueDate - Deadline for the task
 * @property {boolean} dueDateCompleted - Whether the task was finished before the deadline
 * @property {string} coverUrl - URL for an optional cover image
 * @property {Array} labels - Color-coded tags for categorization
 * @property {Array<mongoose.Types.ObjectId>} assignees - Users responsible for this card
 * @property {Array} attachments - Files uploaded and attached to the card
 * @property {Object} metadata - Extended properties like budget and tracking hours
 * @property {Array} checklists - Sub-tasks required to complete this card
 * @property {Date} createdAt - Automatically generated timestamp of creation
 * @property {Date} updatedAt - Automatically generated timestamp of last update
 */

/**
 * Mongoose schema for the Card model.
 * @type {mongoose.Schema}
 */
const cardSchema = new mongoose.Schema({
  // The primary heading or title of the card
  title: {
    type: String,
    required: [true, "Card title is required"],
    trim: true,
  },
  // Extended details about the task
  description: {
    type: String,
    trim: true,
  },
  // Reference to the List that contains this card
  listId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "List",
    required: true,
  },
  // Defines the vertical order of the card within its list
  position: {
    type: Number,
    required: true,
  },
  // Task urgency or importance level
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: null
  },
  // Scheduled start date for the task
  startDate: {
    type: Date,
    default: null
  },
  // Scheduled completion deadline
  dueDate: Date,
  // Indicates if the deadline requirements have been met
  dueDateCompleted: {
    type: Boolean,
    default: false
  },
  // Optional URL for a visual header image on the card
  coverUrl: {
    type: String,
    default: null
  },
  // Custom categorization tags
  labels: [{
    text: String,
    color: String
  }],
  // Users assigned to work on or oversee this card
  assignees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // Associated files or documents
  attachments: [{
    name: String,
    url: String,
    size: Number,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Additional structured data for advanced project management tracking
  metadata: {
    budget: { type: Number, default: 0 },
    actualCost: { type: Number, default: 0 },
    department: { type: String, default: "" },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 }
  },

  // Granular actionable items nested within this card
  checklists: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]

}, { timestamps: true }); // Automatically manage createdAt and updatedAt fields

/**
 * The Card model instance.
 * @type {mongoose.Model}
 */
export default mongoose.model("Card", cardSchema);