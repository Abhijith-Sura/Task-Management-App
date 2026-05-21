import List from "../models/List.js";
import Card from "../models/Card.js";

/**
 * @desc    List Related Business Logic
 */
class ListService {
  /**
   * @desc    Create a new list
   */
  async createList(data) {
    return await List.create(data);
  }

  /**
   * @desc    Get all lists for a board
   */
  async getListsByBoard(boardId) {
    return await List.find({ boardId }).populate("cards");
  }

  /**
   * @desc    Update a list
   */
  async updateList(listId, updates) {
    return await List.findByIdAndUpdate(listId, updates, { new: true });
  }

  /**
   * @desc    Delete a list and its cards
   */
  async deleteList(listId) {
    await Card.deleteMany({ listId });
    return await List.findByIdAndDelete(listId);
  }
}

export default new ListService();
