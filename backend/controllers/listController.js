import listService from "../services/listService.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Creates a new task list within a specific board.
 *
 * @desc    Create a new list
 * @route   POST /api/lists
 * @param   {import('express').Request} req - The Express request object containing the list details (e.g., title, boardId).
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const createList = asyncHandler(async (req, res) => {
  const list = await listService.createList(req.body);
  return successResponse(res, list, "List created successfully", 201);
});

/**
 * Retrieves all lists belonging to a specific board.
 *
 * @desc    Get lists for a board
 * @route   GET /api/lists/:boardId
 * @param   {import('express').Request} req - The Express request object containing the board ID in parameters.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const getLists = asyncHandler(async (req, res) => {
  const lists = await listService.getListsByBoard(req.params.boardId);
  return successResponse(res, lists);
});

/**
 * Deletes a specific list and associated resources from a board.
 *
 * @desc    Delete a list
 * @route   DELETE /api/lists/:id
 * @param   {import('express').Request} req - The Express request object containing the list ID to delete.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const deleteList = asyncHandler(async (req, res) => {
  await listService.deleteList(req.params.id);
  return successResponse(res, null, "List deleted successfully");
});

/**
 * Updates details of an existing list such as its title or position.
 *
 * @desc    Update list details
 * @route   PUT /api/lists/:id
 * @param   {import('express').Request} req - The Express request object containing the updated list details.
 * @param   {import('express').Response} res - The Express response object.
 * @returns {Promise<void>} A promise that resolves when the response is sent.
 */
export const updateList = asyncHandler(async (req, res) => {
  const list = await listService.updateList(req.params.id, req.body);
  return successResponse(res, list, "List updated successfully");
});