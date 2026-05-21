import Automation from "../models/Automation.js";
import Card from "../models/Card.js";
import List from "../models/List.js";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import { broadcastToBoard } from "../sockets/socketHandler.js";

class AutomationService {
  /**
   * @desc    Create automation rule
   */
  async createAutomation(boardId, data) {
    const automation = await Automation.create({
      boardId,
      ...data
    });
    return automation;
  }

  /**
   * @desc    Get automation rules for a board
   */
  async getAutomations(boardId) {
    return await Automation.find({ boardId }).sort("-createdAt");
  }

  /**
   * @desc    Toggle automation status
   */
  async toggleAutomation(automationId, active) {
    return await Automation.findByIdAndUpdate(
      automationId,
      { active },
      { new: true }
    );
  }

  /**
   * @desc    Delete an automation rule
   */
  async deleteAutomation(automationId) {
    await Automation.findByIdAndDelete(automationId);
    return true;
  }

  /**
   * @desc    Evaluate board rules when triggers occur
   */
  async evaluateRules(boardId, triggerType, context = {}) {
    try {
      const activeRules = await Automation.find({ boardId, triggerType, active: true });
      if (!activeRules.length) return;

      const { card, listId } = context;
      if (!card) return;

      let cardUpdated = false;
      const executedRules = [];

      for (const rule of activeRules) {
        // Evaluate Triggers
        if (rule.trigger.type === "CARD_MOVED") {
          // If a list target is defined, ensure card moved to that specific list
          if (rule.trigger.targetListId && card.listId.toString() !== rule.trigger.targetListId.toString()) {
            continue;
          }
        }

        // Execute Actions
        if (rule.action.type === "SET_PRIORITY" && rule.action.priority) {
          if (card.priority !== rule.action.priority) {
            card.priority = rule.action.priority;
            cardUpdated = true;
            executedRules.push(rule.name);
          }
        } 
        else if (rule.action.type === "ASSIGN_USER" && rule.action.assigneeId) {
          const assigneeStr = rule.action.assigneeId.toString();
          const isAlreadyAssigned = card.assignees.some(
            id => (id._id || id).toString() === assigneeStr
          );

          if (!isAlreadyAssigned) {
            card.assignees.push(rule.action.assigneeId);
            cardUpdated = true;
            executedRules.push(rule.name);
          }
        } 
        else if (rule.action.type === "MOVE_CARD" && rule.action.targetListId) {
          if (card.listId.toString() !== rule.action.targetListId.toString()) {
            card.listId = rule.action.targetListId;
            // Get last position in target list to mount it at bottom
            const lastCard = await Card.findOne({ listId: rule.action.targetListId }).sort("-position").lean();
            card.position = lastCard ? lastCard.position + 1000 : 1000;
            cardUpdated = true;
            executedRules.push(rule.name);
          }
        }
      }

      if (cardUpdated) {
        // Save the updated card
        await card.save();
        
        // Populate assignees for the frontend UI compatibility
        const populatedCard = await Card.findById(card._id)
          .populate("assignees", "name avatar")
          .populate("listId", "title");

        // Log automation run in Board Activity
        for (const ruleName of executedRules) {
          await Activity.create({
            action: `⚡ Automation triggered: "${ruleName}" on card "${populatedCard.title}"`,
            type: "AUTOMATION",
            cardId: populatedCard._id,
            boardId: boardId
          });
        }

        // Broadcast real-time Socket notifications to all active board subscribers
        broadcastToBoard(boardId, "update-card", populatedCard);
        broadcastToBoard(boardId, "board-refresh", { boardId });
      }
    } catch (error) {
      console.error("❌ Automation execution failed:", error);
    }
  }
}

export default new AutomationService();
