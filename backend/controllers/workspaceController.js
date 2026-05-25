import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import Invitation from "../models/Invitation.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

/**
 * Creates a new workspace and assigns the creator as the default owner and admin.
 * 
 * @param {Object} req - The Express request object containing workspace details.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the newly created workspace is sent.
 */
export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  
  // Initialize a new workspace, ensuring the creator has full administrative privileges
  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user.id,
    members: [{ user: req.user.id, role: "admin" }]
  });
  
  return successResponse(res, workspace, "Workspace created successfully", 201);
});

/**
 * Retrieves all workspaces the authenticated user is a member of. Automatically initializes
 * a default "Personal" workspace if none exist.
 * 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the list of accessible workspaces is sent.
 */
export const getWorkspaces = asyncHandler(async (req, res) => {
  // Find all workspaces where the current user is listed in the members array
  let workspaces = await Workspace.find({ "members.user": req.user.id })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar");
  
  // Auto-initialize a default "Personal" workspace for new users who have none
  if (workspaces.length === 0) {
    const personal = await Workspace.create({
      name: "Personal",
      description: "Default workspace for your personal boards.",
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }]
    });
    
    // Migrate any orphaned boards (created before workspaces existed) to this new personal workspace
    await Board.updateMany(
      { owner: req.user.id, workspaceId: { $exists: false } },
      { workspaceId: personal._id }
    );
    
    workspaces = [personal];
  }

  return successResponse(res, workspaces);
});

/**
 * Retrieves all boards associated with a specific workspace ID.
 * 
 * @param {Object} req - The Express request object containing the workspace ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the array of associated boards is sent.
 */
export const getWorkspaceBoards = asyncHandler(async (req, res) => {
  // Query all boards belonging to the targeted workspace
  const boards = await Board.find({ workspaceId: req.params.id });
  return successResponse(res, boards);
});

/**
 * Updates basic metadata (e.g., name, description) for an existing workspace.
 * 
 * @param {Object} req - The Express request object containing the update payload.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the updated workspace is sent.
 */
export const updateWorkspace = asyncHandler(async (req, res) => {
  // Apply updates and return the modified document instead of the original
  const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  return successResponse(res, workspace, "Workspace updated");
});

/**
 * Deletes a workspace and cascades the deletion to all associated resources
 * (boards, lists, cards, and invitations).
 * 
 * @param {Object} req - The Express request object containing the workspace ID.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the workspace and all nested entities are deleted.
 */
export const deleteWorkspace = asyncHandler(async (req, res) => {
  const workspaceId = req.params.id;

  // Retrieve all board IDs associated with this workspace to prepare for cascade deletion
  const boards = await Board.find({ workspaceId }).select("_id").lean();
  const boardIds = boards.map(b => b._id);

  if (boardIds.length > 0) {
    // Retrieve all list IDs across all boards in the workspace
    const lists = await List.find({ boardId: { $in: boardIds } }).select("_id").lean();
    const listIds = lists.map(l => l._id);

    // Execute cascade deletion from the lowest nested entity (cards) upwards to boards
    if (listIds.length > 0) {
      await Card.deleteMany({ listId: { $in: listIds } });
      await List.deleteMany({ boardId: { $in: boardIds } });
    }
    await Invitation.deleteMany({ boardId: { $in: boardIds } });
    await Board.deleteMany({ workspaceId });
  }

  // Remove the parent workspace document
  await Workspace.findByIdAndDelete(workspaceId);
  return successResponse(res, null, "Workspace and all associated boards deleted successfully");
});

/**
 * Updates the permission role (e.g., admin, editor, viewer) for a specific member in a workspace.
 * 
 * @param {Object} req - The Express request object containing the new role.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the updated workspace details are sent.
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id: workspaceId, memberId } = req.params;

  // Validate the requested role against allowed permission levels
  if (!["admin", "editor", "viewer"].includes(role)) {
    throw new Error("Invalid role specified");
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }

  // Prevent users from accidentally or maliciously demoting the workspace owner
  if (workspace.owner.toString() === memberId.toString()) {
    throw new Error("Cannot modify the owner's role");
  }

  // Update the specific member's role within the members array
  const updatedWorkspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, "members.user": memberId },
    { $set: { "members.$.role": role } },
    { returnDocument: 'after' }
  ).populate("members.user", "name email avatar");

  return successResponse(res, updatedWorkspace, "Collaborator role updated successfully");
});

/**
 * Removes a member from a workspace and consequently revokes their access
 * to all boards contained within that workspace.
 * 
 * @param {Object} req - The Express request object containing workspace and member IDs.
 * @param {Object} res - The Express response object.
 * @returns {Promise<void>} Resolves when the member is fully evicted.
 */
export const evictMember = asyncHandler(async (req, res) => {
  const { id: workspaceId, memberId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }

  // Ensure the primary owner cannot be removed from their own workspace
  if (workspace.owner.toString() === memberId.toString()) {
    throw new Error("Cannot evict the workspace owner");
  }

  // Remove the user reference from the workspace's members array
  const updatedWorkspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $pull: { members: { user: memberId } } },
    { returnDocument: 'after' }
  ).populate("members.user", "name email avatar");

  // Cascade the eviction by removing the user from all underlying boards in this workspace
  await Board.updateMany(
    { workspaceId },
    { $pull: { members: memberId } }
  );

  return successResponse(res, updatedWorkspace, "Collaborator evicted successfully");
});
