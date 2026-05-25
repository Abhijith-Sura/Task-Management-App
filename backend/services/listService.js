import List from "../models/List.js";
import Card from "../models/Card.js";

/**
 * Service handling business logic for board lists.
 * Provides methods to create, retrieve, update, and delete lists.
 */
class ListService {
  /**
   * Creates a new list within a board.
   * 
   * @param {Object} data - The list details.
   * @param {string} data.title - The title of the list.
   * @param {string|mongoose.Types.ObjectId} data.boardId - The ID of the parent board.
   * @param {number} [data.position] - The visual ordering position of the list.
   * @returns {Promise<Object>} The newly created list document.
   */
  async createList(data) {
    return await List.create(data);
  }

  /**
   * Retrieves all lists associated with a specific board, including their respective cards.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board to query.
   * @returns {Promise<Array>} Array of populated list documents.
   */
  async getListsByBoard(boardId) {
    return await List.find({ boardId }).populate("cards");
  }

  /**
   * Updates an existing list's details.
   * 
   * @param {string|mongoose.Types.ObjectId} listId - The ID of the list to update.
   * @param {Object} updates - The fields to update (e.g., title, position).
   * @returns {Promise<Object|null>} The updated list document, or null if not found.
   */
  async updateList(listId, updates) {
    return await List.findByIdAndUpdate(listId, updates, { new: true });
  }

  /**
   * Deletes a list and all cards contained within it to prevent orphaned data.
   * 
   * @param {string|mongoose.Types.ObjectId} listId - The ID of the list to delete.
   * @returns {Promise<Object|null>} The deleted list document.
   */
  async deleteList(listId) {
    // Remove all associated cards before deleting the list to maintain data integrity
    await Card.deleteMany({ listId });
    
    return await List.findByIdAndDelete(listId);
  }
}

export default new ListService();
