import Workspace from "../models/Workspace.js";
import Board from "../models/Board.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

/**
 * @desc    Create new workspace
 */
export const createWorkspace = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user.id,
    members: [{ user: req.user.id, role: "admin" }]
  });
  return successResponse(res, workspace, "Workspace created successfully", 201);
});

/**
 * @desc    Get user's workspaces
 */
export const getWorkspaces = asyncHandler(async (req, res) => {
  let workspaces = await Workspace.find({ "members.user": req.user.id })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email avatar");
  
  // Auto-initialize "Personal" workspace if none exists
  if (workspaces.length === 0) {
    const personal = await Workspace.create({
      name: "Personal",
      description: "Default workspace for your personal boards.",
      owner: req.user.id,
      members: [{ user: req.user.id, role: "admin" }]
    });
    
    // Assign any existing boards with no workspaceId to this workspace
    await Board.updateMany(
      { owner: req.user.id, workspaceId: { $exists: false } },
      { workspaceId: personal._id }
    );
    
    workspaces = [personal];
  }

  return successResponse(res, workspaces);
});

/**
 * @desc    Get boards within a workspace
 */
export const getWorkspaceBoards = asyncHandler(async (req, res) => {
  const boards = await Board.find({ workspaceId: req.params.id });
  return successResponse(res, boards);
});

/**
 * @desc    Update workspace
 */
export const updateWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
  return successResponse(res, workspace, "Workspace updated");
});

/**
 * @desc    Delete workspace
 */
export const deleteWorkspace = asyncHandler(async (req, res) => {
  await Workspace.findByIdAndDelete(req.params.id);
  // Also cleanup boards? (Usually optional or prompt user)
  return successResponse(res, null, "Workspace deleted");
});

/**
 * @desc    Update collaborator role
 */
export const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const { id: workspaceId, memberId } = req.params;

  if (!["admin", "editor", "viewer"].includes(role)) {
    throw new Error("Invalid role specified");
  }

  // Prevent admin from changing their own role (they can change other members)
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }

  if (workspace.owner.toString() === memberId.toString()) {
    throw new Error("Cannot modify the owner's role");
  }

  const updatedWorkspace = await Workspace.findOneAndUpdate(
    { _id: workspaceId, "members.user": memberId },
    { $set: { "members.$.role": role } },
    { returnDocument: 'after' }
  ).populate("members.user", "name email avatar");

  return successResponse(res, updatedWorkspace, "Collaborator role updated successfully");
});

/**
 * @desc    Evict collaborator from workspace
 */
export const evictMember = asyncHandler(async (req, res) => {
  const { id: workspaceId, memberId } = req.params;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }

  if (workspace.owner.toString() === memberId.toString()) {
    throw new Error("Cannot evict the workspace owner");
  }

  const updatedWorkspace = await Workspace.findByIdAndUpdate(
    workspaceId,
    { $pull: { members: { user: memberId } } },
    { returnDocument: 'after' }
  ).populate("members.user", "name email avatar");

  return successResponse(res, updatedWorkspace, "Collaborator evicited successfully");
});
