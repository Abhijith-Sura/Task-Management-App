/**
 * @fileoverview Invitation model for the task management application.
 * Handles the schema for tracking board invitations sent to new or existing users.
 */
import mongoose from "mongoose";

/**
 * @typedef {Object} Invitation
 * @property {string} email - The email address being invited
 * @property {mongoose.Types.ObjectId} boardId - The board the user is invited to
 * @property {string} role - The role assigned to the invited user (admin, editor, viewer)
 * @property {string} token - Unique secure token used in the invitation link
 * @property {string} status - Current state of the invitation (pending, accepted, revoked)
 * @property {mongoose.Types.ObjectId} invitedBy - The user who sent the invitation
 * @property {Date} createdAt - Automatically generated timestamp of creation
 * @property {Date} updatedAt - Automatically generated timestamp of last update
 */

/**
 * Mongoose schema for the Invitation model.
 * @type {mongoose.Schema}
 */
const invitationSchema = new mongoose.Schema({
  // The recipient's email address
  email: { 
    type: String, 
    required: [true, "Email address is required"], 
    trim: true, 
    lowercase: true 
  },
  // The target board the user is being invited to collaborate on
  boardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Board", 
    required: true 
  },
  // Permission level to be granted upon acceptance
  role: { 
    type: String, 
    enum: ["admin", "editor", "viewer"], 
    default: "editor" 
  },
  // Unique cryptographic token sent via email to verify the invite
  token: { 
    type: String, 
    unique: true, 
    required: true 
  },
  // Lifecycle status of the invitation
  status: { 
    type: String, 
    enum: ["pending", "accepted", "revoked"], 
    default: "pending" 
  },
  // The user who initiated the invitation process
  invitedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }
}, { 
  timestamps: true // Automatically manage createdAt and updatedAt fields
});

/**
 * The Invitation model instance.
 * @type {mongoose.Model}
 */
export default mongoose.model("Invitation", invitationSchema);
