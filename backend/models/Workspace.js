import mongoose from "mongoose";

/**
 * Mongoose schema representing a workspace.
 * Workspaces group multiple boards together and manage access control for teams of users.
 *
 * @typedef {mongoose.Schema} WorkspaceSchema
 */
const workspaceSchema = new mongoose.Schema({
  /**
   * The display name of the workspace.
   */
  name: {
    type: String,
    required: [true, "Workspace name is required"],
    trim: true,
  },
  /**
   * Optional description outlining the purpose or focus of the workspace.
   */
  description: {
    type: String,
    trim: true,
  },
  /**
   * Reference to the User who created and owns the workspace.
   * The owner has ultimate administrative privileges.
   */
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  /**
   * List of users who have access to this workspace, along with their assigned roles.
   * Defines the authorization boundaries for reading and writing data within the workspace.
   */
  members: [{
    /**
     * Reference to the member user.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    /**
     * The access level of the member within the workspace.
     * Roles include: admin (full access), editor (can modify content), viewer (read-only).
     */
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "editor"
    }
  }],
}, { timestamps: true }); // Automatically manages createdAt and updatedAt fields

/**
 * Mongoose model for the Workspace collection.
 * 
 * @module models/Workspace
 */
export default mongoose.model("Workspace", workspaceSchema);
