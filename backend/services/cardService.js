import mongoose from "mongoose";
import Card from "../models/Card.js";
import List from "../models/List.js";
import Activity from "../models/Activity.js";
import sendEmail from "../utils/sendEmail.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Board from "../models/Board.js";

/**
 * @desc    Card Related Business Logic
 */
class CardService {
  /**
   * @desc    Create a new card
   */
  async createCard(data, userId) {
    const lastCard = await Card.findOne({ listId: data.listId }).sort("-position");
    const position = lastCard ? lastCard.position + 1000 : 1000;

    const card = await Card.create({
      ...data,
      position
    });

    await this.logActivity(userId, `Created card "${card.title}"`, card._id, data.listId, "CREATE");

    return card;
  }

  /**
   * @desc    Update card details
   */
  async updateCard(cardId, updates, userId) {
    const oldCard = await Card.findById(cardId).lean();
    if (!oldCard) throw new Error("Card not found");

    const card = await Card.findByIdAndUpdate(
      cardId,
      { $set: updates },
      { new: true }
    ).populate("assignees", "name email avatar");

    // Email notification for new assignees
    if (updates.assignees) {
      const oldAssigneeIds = (oldCard.assignees || []).map(id => id.toString());
      const newAssignees = (card.assignees || []).filter(a => !oldAssigneeIds.includes(a._id.toString()));
      
      if (newAssignees.length > 0) {
        // Fetch assigning user name
        const assigningUser = await User.findById(userId).select("name").lean();
        const assignerName = assigningUser?.name || "A team member";

        for (const assignee of newAssignees) {
          if (assignee.email) {
            sendEmail({
              email: assignee.email,
              subject: `📋 Task Assigned: "${card.title}"`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #121214; color: #e2e8f0;">
                  <h2 style="color: #3b82f6; margin-top: 0;">New Task Assignment</h2>
                  <p>Hi <strong>${assignee.name}</strong>,</p>
                  <p>You have been assigned to a new task by <strong>${assignerName}</strong>.</p>
                  <hr style="border: none; border-top: 1px solid #2d2d34; margin: 20px 0;" />
                  <h3 style="margin-bottom: 5px; color: #ffffff;">${card.title}</h3>
                  <p style="color: #a0aec0; margin-top: 0;">${card.description || "<i>No description provided</i>"}</p>
                  <div style="background-color: #1a1a1e; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #2d2d34;">
                    <table style="width: 100%; font-size: 14px; color: #e2e8f0;">
                      <tr>
                        <td style="color: #718096; width: 100px; padding: 4px 0;">Priority:</td>
                        <td style="font-weight: bold; text-transform: uppercase; padding: 4px 0;">${card.priority || 'Medium'}</td>
                      </tr>
                      ${card.dueDate ? `
                      <tr>
                        <td style="color: #718096; padding: 4px 0;">Due Date:</td>
                        <td style="font-weight: bold; padding: 4px 0;">${new Date(card.dueDate).toLocaleDateString()}</td>
                      </tr>
                      ` : ''}
                    </table>
                  </div>
                  <p style="font-size: 12px; color: #718096; text-align: center; margin-top: 30px;">
                    This is an automated notification. Please check your workspace to view the task.
                  </p>
                </div>
              `
            }).catch(err => console.error("Failed to send assignment email:", err));
          }
        }
      }
    }

    // Detect exactly what changed
    const changes = [];
    if (updates.title && updates.title !== oldCard.title) changes.push(`title to "${updates.title}"`);
    if (updates.priority && updates.priority !== oldCard.priority) changes.push(`priority to "${updates.priority}"`);
    if (updates.description && updates.description !== oldCard.description) changes.push("description");

    if (updates.dueDate !== undefined) {
      const getSafeDateStr = (dateVal) => {
        if (!dateVal) return '';
        try {
          const d = new Date(dateVal);
          return isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };
      const oldDueStr = getSafeDateStr(oldCard.dueDate);
      const newDueStr = getSafeDateStr(updates.dueDate);
      if (oldDueStr !== newDueStr) {
        changes.push(`due date to ${newDueStr || 'none'}`);
      }
    }

    if (updates.dueDateCompleted !== undefined && updates.dueDateCompleted !== oldCard.dueDateCompleted) {
      changes.push(`due date status to ${updates.dueDateCompleted ? 'completed' : 'incomplete'}`);
    }

    if (updates.metadata) {
      const oldMeta = oldCard.metadata || {};
      const newMeta = updates.metadata;
      if (newMeta.budget !== undefined && Number(newMeta.budget) !== Number(oldMeta.budget || 0)) {
        changes.push(`estimated budget to $${newMeta.budget}`);
      }
      if (newMeta.actualCost !== undefined && Number(newMeta.actualCost) !== Number(oldMeta.actualCost || 0)) {
        changes.push(`actual cost spent to $${newMeta.actualCost}`);
      }
      if (newMeta.estimatedHours !== undefined && Number(newMeta.estimatedHours) !== Number(oldMeta.estimatedHours || 0)) {
        changes.push(`estimated effort to ${newMeta.estimatedHours} hrs`);
      }
      if (newMeta.actualHours !== undefined && Number(newMeta.actualHours) !== Number(oldMeta.actualHours || 0)) {
        changes.push(`logged effort to ${newMeta.actualHours} hrs`);
      }
      if (newMeta.department !== undefined && newMeta.department !== oldMeta.department) {
        changes.push(`department to "${newMeta.department || 'None'}"`);
      }
    }

    if (updates.checklists && Array.isArray(updates.checklists)) {
      const oldLength = (oldCard.checklists || []).length;
      const oldCompleted = (oldCard.checklists || []).filter(c => c && c.completed).length;
      const newLength = updates.checklists.length;
      const newCompleted = updates.checklists.filter(c => c && c.completed).length;

      if (oldLength !== newLength) {
        changes.push(newLength > oldLength ? "added checklist item" : "removed checklist item");
      } else {
        if (oldCompleted !== newCompleted) {
          changes.push(`checklist progress to ${newCompleted}/${newLength}`);
        }
      }

      // Check if checklist transitioned to fully completed status (at least one item, previously not completed, now completed)
      const wasFullyCompleted = oldLength > 0 && oldCompleted === oldLength;
      const isNowFullyCompleted = newLength > 0 && newCompleted === newLength;

      if (!wasFullyCompleted && isNowFullyCompleted) {
        const list = await List.findById(card.listId).select("boardId").lean();
        if (list?.boardId) {
          import("./automationService.js").then(({ default: automationService }) => {
            automationService.evaluateRules(list.boardId, "CHECKLIST_COMPLETED", { card, listId: card.listId });
          }).catch(err => console.error("Failed to load automation service in checklist completed trigger:", err));
        }
      }
    }

    if (changes.length > 0) {
      await this.logActivity(
        userId, 
        `Updated ${changes.join(", ")} on "${card.title}"`, 
        card._id, 
        card.listId, 
        "UPDATE",
        { changes, oldValues: { title: oldCard.title, priority: oldCard.priority } }
      );
    }

    return card;
  }

  /**
   * @desc    Move card to a new list or position
   */
  async moveCard(cardId, newListId, newPosition, userId) {
    const oldCard = await Card.findById(cardId).lean();
    if (!oldCard) throw new Error("Card not found");

    const card = await Card.findByIdAndUpdate(
      cardId,
      { listId: newListId, position: newPosition },
      { new: true }
    );

    if (oldCard.listId.toString() !== newListId.toString()) {
      const [oldList, newList] = await Promise.all([
        List.findById(oldCard.listId).select("title").lean(),
        List.findById(newListId).select("boardId title").lean()
      ]);

      await this.logActivity(
        userId, 
        `Moved "${card.title}" from "${oldList?.title || 'Unknown'}" to "${newList?.title || 'Unknown'}"`, 
        card._id, 
        newListId, 
        "MOVE",
        { from: oldList?.title, to: newList?.title }
      );

      // Trigger active automation rules for the board
      if (newList?.boardId) {
        import("./automationService.js").then(({ default: automationService }) => {
          automationService.evaluateRules(newList.boardId, "CARD_MOVED", { card, listId: newListId });
        }).catch(err => console.error("Failed to load automation service inside cardService:", err));
      }
    } else {
      await this.logActivity(userId, `Reordered "${card.title}" within the list`, card._id, newListId, "MOVE");
    }

    return card;
  }

  /**
   * @desc    Add attachment to card
   */
  async addAttachment(cardId, fileData, userId) {
    const card = await Card.findByIdAndUpdate(
      cardId,
      { $push: { attachments: {
        name: fileData.name,
        url: fileData.url,
        size: fileData.size,
        mimeType: fileData.mimeType
      }}},
      { new: true }
    );
    
    await this.logActivity(userId, `Attached file "${fileData.name}" to "${card.title}"`, cardId, card.listId, "ATTACHMENT");
    return card;
  }

  /**
   * @desc    Delete a card
   */
  async deleteCard(cardId, userId) {
    const card = await Card.findById(cardId);
    if (!card) throw new Error("Card not found");

    await Card.findByIdAndDelete(cardId);
    await Comment.deleteMany({ cardId });
    await Activity.deleteMany({ cardId });

    return true;
  }

  /**
   * @desc    Log card activity with board context
   */
  async logActivity(user, action, cardId, listId, type = "UPDATE", details = {}) {
    if (!user) return;
    try {
      let boardId = null;
      if (listId) {
        const list = await List.findById(listId).select("boardId").lean();
        boardId = list?.boardId || null;
      }

      await Activity.create({
        user,
        action,
        type,
        details,
        cardId,
        boardId
      });
    } catch (err) {
      console.error("Activity log failed:", err);
    }
  }
  /**
   * @desc    Global search across all boards user has access to
   */
  async searchCards(query, userId) {
    if (!query) return [];

    const userBoards = await Board.find({
      $or: [{ owner: userId }, { members: userId }]
    }).select("_id");
    
    const boardIds = userBoards.map(b => b._id);
    const userLists = await List.find({ boardId: { $in: boardIds } }).select("_id boardId title");
    const listIds = userLists.map(l => l._id);

    const cards = await Card.find({
      listId: { $in: listIds },
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ]
    }).limit(10).lean();

    // Map board/list info for the frontend
    return cards.map(card => {
      const list = userLists.find(l => l._id.toString() === card.listId.toString());
      return {
        ...card,
        listTitle: list?.title,
        boardId: list?.boardId
      };
    });
  }
}

export default new CardService();
