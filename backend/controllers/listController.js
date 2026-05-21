import listService from "../services/listService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * @desc    Create a new list
 * @route   POST /api/lists
 */
export const createList = asyncHandler(async (req, res) => {
  const list = await listService.createList(req.body);
  return successResponse(res, list, "List created successfully", 201);
});

/**
 * @desc    Get lists for a board
 * @route   GET /api/lists/:boardId
 */
export const getLists = asyncHandler(async (req, res) => {
  const lists = await listService.getListsByBoard(req.params.boardId);
  return successResponse(res, lists);
});

/**
 * @desc    Delete a list
 * @route   DELETE /api/lists/:id
 */
export const deleteList = asyncHandler(async (req, res) => {
  await listService.deleteList(req.params.id);
  return successResponse(res, null, "List deleted successfully");
});

/**
 * @desc    Update list details
 * @route   PUT /api/lists/:id
 */
export const updateList = asyncHandler(async (req, res) => {
  const list = await listService.updateList(req.params.id, req.body);
  return successResponse(res, list, "List updated successfully");
});