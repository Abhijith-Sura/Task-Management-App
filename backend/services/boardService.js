import mongoose from "mongoose";
import AppError from "../utils/AppError.js";
import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import Invitation from "../models/Invitation.js";
import boardTemplates from "../config/boardTemplates.js";
import Automation from "../models/Automation.js";
import Workspace from "../models/Workspace.js";

/**
 * Service handling business logic for boards.
 * Manages board creation, templates, retrieval, updates, deletions, and member invitations.
 */
class BoardService {
  /**
   * Creates a new board for a user, optionally placing it in a specific workspace.
   * If no workspace is provided, it defaults to or creates a "Personal" workspace.
   * 
   * @param {Object} data - The board creation payload.
   * @param {string} data.title - The title of the board.
   * @param {string|mongoose.Types.ObjectId} [data.workspaceId] - The target workspace ID.
   * @param {string} [data.category] - The category/type of the board.
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the user creating the board.
   * @returns {Promise<Object>} The newly created board document.
   */
  async createBoard(data, userId) {
    let { title, workspaceId, category } = data;

    // Fallback to a "Personal" workspace if none is specified
    if (!workspaceId) {
      let personal = await Workspace.findOne({ owner: userId, name: "Personal" });
      
      // Auto-create the Personal workspace if it doesn't exist for the user
      if (!personal) {
        personal = await Workspace.create({
          name: "Personal",
          description: "Default workspace for your personal boards.",
          owner: userId,
          members: [{ user: userId, role: "admin" }]
        });
      }
      workspaceId = personal._id;
    }

    return await Board.create({
      title,
      workspaceId,
      owner: userId,
      category: category || "General",
      inviteToken: crypto.randomBytes(20).toString("hex") // Pre-generate an invite token for shareable links
    });
  }

  /**
   * Creates a new board by deep-cloning an enterprise template configuration.
   * Copies lists, cards, checklists, and automations from the template.
   * 
   * @param {Object} data - The template instantiation payload.
   * @param {string} data.templateId - The ID of the template to clone.
   * @param {string} [data.title] - Override title for the new board.
   * @param {string|mongoose.Types.ObjectId} [data.workspaceId] - The target workspace ID.
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the user creating the board.
   * @returns {Promise<Object>} The fully populated new board document.
   * @throws {AppError} If the templateId is invalid or not found.
   */
  async createBoardFromTemplate(data, userId) {
    const { templateId, title, workspaceId } = data;
    
    // 1. Fetch template definition
    const template = boardTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new AppError(`Template with id '${templateId}' not found.`, 404);
    }

    // 2. Create the board
    const board = await this.createBoard({
      title: title || template.title,
      workspaceId,
      category: template.category
    }, userId);

    // 3. Deep-clone lists and nested cards
    if (template.lists && template.lists.length > 0) {
      for (let i = 0; i < template.lists.length; i++) {
        const listData = template.lists[i];
        
        // Create List document linked to new board
        const newList = await List.create({
          title: listData.title,
          boardId: board._id,
          position: i * 1000
        });

        // Add to board.lists list array
        board.lists.push(newList._id);

        // Pre-populate cards for this list
        if (listData.cards && listData.cards.length > 0) {
          for (let j = 0; j < listData.cards.length; j++) {
            const cardData = listData.cards[j];
            
            // Flatten template checklists to match mongoose schema
            let flatChecklists = [];
            if (cardData.checklists && cardData.checklists.length > 0) {
              for (const checklistGroup of cardData.checklists) {
                if (checklistGroup.items && checklistGroup.items.length > 0) {
                  for (const item of checklistGroup.items) {
                    flatChecklists.push({
                      text: item.text,
                      completed: !!item.completed
                    });
                  }
                } else if (checklistGroup.text) {
                  flatChecklists.push({
                    text: checklistGroup.text,
                    completed: !!checklistGroup.completed
                  });
                }
              }
            }

            // Create Card document linked to new list
            const newCard = await Card.create({
              title: cardData.title,
              description: cardData.description || "",
              priority: cardData.priority || "medium",
              listId: newList._id,
              boardId: board._id,
              position: j * 1000,
              labels: cardData.labels || [],
              checklists: flatChecklists
            });

            // Add to list.cards array
            newList.cards.push(newCard._id);
          }
          await newList.save();
        }
      }
      await board.save();
    }

    // 4. Register custom default automations for this board
    if (template.automations && template.automations.length > 0) {
      for (const auto of template.automations) {
        // Resolve listId target for trigger if list title matches template
        let triggerListId = null;
        if (auto.triggerMetadata?.listName) {
          const matchingList = await List.findOne({
            boardId: board._id,
            title: auto.triggerMetadata.listName
          });
          if (matchingList) triggerListId = matchingList._id;
        }

        // Persist the copied automation rules
        await Automation.create({
          boardId: board._id,
          name: auto.name,
          trigger: {
            type: auto.triggerType,
            metadata: triggerListId ? { listId: triggerListId } : auto.triggerMetadata
          },
          action: {
            type: auto.actionType,
            metadata: auto.actionMetadata
          },
          active: true
        });
      }
    }

    // Return fully populated board with populated lists and cards
    return await Board.findById(board._id).populate({
      path: "lists",
      populate: { path: "cards" }
    });
  }

  /**
   * Retrieves all boards that a user owns or is a member of.
   * 
   * @param {string|mongoose.Types.ObjectId} userId - The user's ID.
   * @returns {Promise<Array>} Array of boards populated with member, owner, and workspace details.
   */
  async getUserBoards(userId) {
    return await Board.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .populate("members", "name email avatar")
      .populate("owner", "name email avatar")
      .populate("workspaceId")
      .sort({ createdAt: -1 });
  }

  /**
   * Retrieves a specific board with full nested details (lists, cards, assignees, comments count).
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board.
   * @returns {Promise<Object>} The heavily populated board document.
   * @throws {AppError} If the board is not found.
   */
  async getBoardDetails(boardId) {
    const board = await Board.findById(boardId)
      .populate({
        path: "lists",
        populate: {
          path: "cards",
          options: { sort: { position: 1 } },
          populate: {
            path: "assignees",
            select: "name avatar"
          }
        }
      })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .populate({
        path: "workspaceId",
        populate: {
          path: "members.user",
          select: "name email avatar"
        }
      })
      .lean();

    if (!board) {
      throw new AppError("Board not found", 404);
    }

    // Add comment counts dynamically to each card for UI display
    for (const list of board.lists) {
      for (const card of list.cards) {
        card.commentCount = await Comment.countDocuments({ cardId: card._id });
      }
    }

    return board;
  }

  /**
   * Updates core board attributes such as title or category.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board to update.
   * @param {Object} updates - The fields to update.
   * @returns {Promise<Object>} The updated and populated board document.
   * @throws {AppError} If the board is not found.
   */
  async updateBoard(boardId, updates) {
    const board = await Board.findByIdAndUpdate(
      boardId,
      { $set: updates },
      { new: true }
    )
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    if (!board) throw new AppError("Board not found", 404);
    return board;
  }

  /**
   * Invites a user to a board by email.
   * If the user is already registered in the system, they are added directly to the board and workspace.
   * If not registered, a targeted invitation email is sent with a signup link.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The board to invite the member to.
   * @param {string} email - The email address of the invitee.
   * @param {string|mongoose.Types.ObjectId} userId - The user ID sending the invite.
   * @param {string} [clientOrigin] - The frontend URL origin for constructing email links.
   * @returns {Promise<Object|null>} The updated board if added directly, or null if an email invite was sent.
   */
  async inviteMember(boardId, email, userId, clientOrigin) {
    const user = await User.findOne({ email: email.toLowerCase() });

    // If user exists in the system, add them directly to the board
    if (user) {
      const board = await Board.findByIdAndUpdate(
        boardId,
        { $addToSet: { members: user._id } },
        { new: true }
      ).populate("members", "name email avatar");

      if (board && board.workspaceId) {
        await Workspace.updateOne(
          { _id: board.workspaceId, "members.user": { $ne: user._id } },
          { $push: { members: { user: user._id, role: "editor" } } }
        );
      }

      return board;
    }

    // If user is NOT registered, send a targeted invitation email instead
    // so they can sign up and be added to the board upon accepting
    if (userId && clientOrigin) {
      await this.createInvitation(boardId, email, "editor", userId, clientOrigin);
    }

    // Return null to signal an invite email was sent, not a direct add
    return null;
  }

  /**
   * Deletes a board and all its associated lists and cards to ensure no orphaned data remains.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board to delete.
   * @returns {Promise<Object>} The deleted board document.
   */
  async deleteBoard(boardId) {
    const lists = await List.find({ boardId });
    const listIds = lists.map((l) => l._id);

    // Delete cards in those lists
    await Card.deleteMany({ listId: { $in: listIds } });
    // Delete lists
    await List.deleteMany({ boardId });
    // Delete board
    return await Board.findByIdAndDelete(boardId);
  }

  /**
   * Generates a generic, shareable invitation link for the board.
   * Access requires the user to be the board owner, a board member, or a workspace admin.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board.
   * @param {string|mongoose.Types.ObjectId} userId - The requesting user's ID.
   * @param {string} [clientOrigin] - The frontend URL origin for constructing the link.
   * @returns {Promise<Object>} Object containing the inviteLink string.
   * @throws {AppError} If unauthorized or board not found.
   */
  async generateInviteLink(boardId, userId, clientOrigin) {
    const board = await Board.findById(boardId).populate("workspaceId");
    if (!board) throw new AppError("Board not found", 404);

    const isBoardOwner = board.owner.toString() === userId.toString();
    const isBoardMember = board.members.some(m => m.toString() === userId.toString());
    const workspace = board.workspaceId;
    const isWorkspaceMember = workspace && (
      workspace.owner.toString() === userId.toString() ||
      workspace.members.some(m => m.user && m.user.toString() === userId.toString())
    );

    if (!isBoardOwner && !isBoardMember && !isWorkspaceMember) {
      throw new AppError("You must be a board or workspace member to generate an invite link", 403);
    }

    if (!board.inviteToken) {
      board.inviteToken = crypto.randomBytes(16).toString("hex");
      await board.save();
    }

    const frontendUrl = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    return { inviteLink: `${frontendUrl}/b/invite/${board.inviteToken}` };
  }

  /**
   * Resets the generic invitation link, revoking any previously generated links.
   * Only the board owner or workspace admin can reset the link.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board.
   * @param {string|mongoose.Types.ObjectId} userId - The requesting user's ID.
   * @param {string} [clientOrigin] - The frontend URL origin.
   * @returns {Promise<Object>} Object containing the new inviteLink string.
   * @throws {AppError} If unauthorized or board not found.
   */
  async resetInviteLink(boardId, userId, clientOrigin) {
    const board = await Board.findById(boardId).populate("workspaceId");
    if (!board) throw new AppError("Board not found", 404);

    const isBoardOwner = board.owner.toString() === userId.toString();
    const workspace = board.workspaceId;
    const isWorkspaceAdminOrOwner = workspace && (
      workspace.owner.toString() === userId.toString() ||
      workspace.members.some(m => m.user && m.user.toString() === userId.toString() && m.role === "admin")
    );

    if (!isBoardOwner && !isWorkspaceAdminOrOwner) {
      throw new AppError("Only the board owner or a workspace admin can reset invite links", 403);
    }

    board.inviteToken = crypto.randomBytes(16).toString("hex");
    await board.save();

    const frontendUrl = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    return { inviteLink: `${frontendUrl}/b/invite/${board.inviteToken}` };
  }

  /**
   * Allows a user to join a board using a generic invite token.
   * Validates the token and adds the user to the board and workspace members.
   * 
   * @param {string} token - The invite token from the link.
   * @param {string|mongoose.Types.ObjectId} userId - The user joining the board.
   * @returns {Promise<Object>} Object containing the joined boardId.
   * @throws {AppError} If token is invalid or expired.
   */
  async joinViaLink(token, userId) {
    const board = await Board.findOne({ inviteToken: token });
    if (!board) throw new AppError("Invalid or expired invite link", 404);

    if (
      !board.members.includes(userId) &&
      board.owner.toString() !== userId.toString()
    ) {
      board.members.push(userId);
      await board.save();

      if (board.workspaceId) {
        await Workspace.updateOne(
          { _id: board.workspaceId, "members.user": { $ne: userId } },
          { $push: { members: { user: userId, role: "editor" } } }
        );
      }
    }

    return { boardId: board._id };
  }

  /**
   * Sends a generic email invitation with the shareable link to join the board.
   * Only the board owner can send these emails.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board.
   * @param {string} email - The email address to send the invitation to.
   * @param {string|mongoose.Types.ObjectId} userId - The user sending the email.
   * @param {string} [clientOrigin] - The frontend URL origin.
   * @returns {Promise<Object>} Success message.
   * @throws {AppError} If email dispatch fails or unauthorized.
   */
  async sendInviteEmail(boardId, email, userId, clientOrigin) {
    const board = await Board.findById(boardId).populate("owner", "name");
    if (!board) throw new AppError("Board not found", 404);
    if (board.owner._id.toString() !== userId.toString()) {
      throw new AppError("Only the board owner can send email invites", 403);
    }

    if (!board.inviteToken) {
      board.inviteToken = crypto.randomBytes(16).toString("hex");
      await board.save();
    }

    const frontendUrl = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteUrl = `${frontendUrl}/b/invite/${board.inviteToken}`;

    const html = `
      <div style="background-color: #09090b; padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f4f4f5; text-align: center; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 56px; height: 56px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
          <span style="font-size: 28px; color: #fff; font-weight: bold; line-height: 56px; display: block; text-align: center; width: 100%;">⚡</span>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 8px 0; letter-spacing: -0.025em;">COLLABORATION INVITATION</h1>
        <p style="font-size: 11px; color: #3b82f6; margin: 0 0 24px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.15em;">Workspace Invitation</p>
        <p style="font-size: 15px; color: #a1a1aa; line-height: 1.6; margin: 0 0 32px 0;">
          <strong style="color: #fff;">${board.owner.name}</strong> has invited you to collaborate on the board <strong style="color: #3b82f6;">${board.title}</strong>.
        </p>
        <a href="${inviteUrl}" style="background-color: #3b82f6; color: #fff; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: bold; border-radius: 12px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">View Board</a>
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
          <p style="font-size: 11px; color: #52525b; line-height: 1.5; margin: 0;">
            If you do not have an active account, you will be prompted to create one when you click the button.<br/>
            This link will expire once you accept or a new link is generated.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email,
        subject: `Invitation to join board: ${board.title}`,
        message: `Join ${board.title} at ${inviteUrl}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send invite email", error);
      throw new AppError("Failed to send invite email", 500);
    }

    return { message: "Invite email sent successfully" };
  }

  /**
   * Creates and emails a new targeted, individual invitation to a specific user.
   * The invitation grants a specific role and is bound to the provided email address.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The board ID.
   * @param {string} email - The target invitee email address.
   * @param {string} role - The role to grant (e.g., 'editor', 'viewer').
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the user creating the invite.
   * @param {string} [clientOrigin] - The frontend URL origin.
   * @returns {Promise<Object>} The created invitation record.
   * @throws {AppError} If user is already a member, or email sending fails.
   */
  async createInvitation(boardId, email, role, userId, clientOrigin) {
    const board = await Board.findById(boardId).populate("owner", "name");
    if (!board) throw new AppError("Board not found", 404);

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser && (board.members.includes(existingUser._id) || board.owner.toString() === existingUser._id.toString())) {
      throw new AppError("User is already a member of this board", 409);
    }

    // Revoke any existing pending invitations for this email + board to avoid clutter
    await Invitation.updateMany(
      { boardId, email: email.toLowerCase(), status: "pending" },
      { status: "revoked" }
    );

    // Create fresh invitation record
    const token = crypto.randomBytes(24).toString("hex");
    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      boardId,
      role: role || "editor",
      token,
      invitedBy: userId
    });

    const frontendUrl = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteUrl = `${frontendUrl}/b/invite/individual/${token}`;

    const html = `
      <div style="background-color: #09090b; padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f4f4f5; text-align: center; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 56px; height: 56px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
          <span style="font-size: 28px; color: #fff; font-weight: bold; line-height: 56px; display: block; text-align: center; width: 100%;">✉️</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0; letter-spacing: -0.025em; text-transform: uppercase;">BOARD COLLABORATOR INVITATION</h1>
        <p style="font-size: 10px; color: #8b5cf6; margin: 0 0 24px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.15em;">Gated Targeted Access</p>
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 32px 0;">
          <strong style="color: #fff;">${board.owner.name}</strong> has invited you to collaborate as an <strong style="color: #8b5cf6; text-transform: uppercase;">${role || "editor"}</strong> on their board: <br/>
          <strong style="color: #fff; font-size: 16px;">${board.title}</strong>
        </p>
        <a href="${inviteUrl}" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: bold; border-radius: 12px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">Accept Invitation</a>
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
          <p style="font-size: 11px; color: #52525b; line-height: 1.5; margin: 0;">
            This invitation was specifically generated for <strong>${email}</strong>.<br/>
            If you do not have an active account under this email, you will be prompted to create one to accept this invitation.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email,
        subject: `Invitation to collaborate on: ${board.title}`,
        message: `Join ${board.title} as ${role} at ${inviteUrl}`,
        html,
      });
    } catch (error) {
      console.error("Failed to send targeted invite email", error);
      // Delete the record if email dispatch fails completely
      await Invitation.findByIdAndDelete(invitation._id);
      throw new AppError("Failed to send targeted email invitation", 500);
    }

    return invitation;
  }

  /**
   * Retrieves all pending targeted invitations for a specific board.
   * 
   * @param {string|mongoose.Types.ObjectId} boardId - The ID of the board.
   * @returns {Promise<Array>} Array of populated pending invitation documents.
   */
  async getInvitations(boardId) {
    return await Invitation.find({ boardId, status: "pending" })
      .populate("invitedBy", "name email avatar")
      .sort("-createdAt");
  }

  /**
   * Revokes/cancels a targeted invitation, rendering its link invalid.
   * Only the board owner can revoke invitations.
   * 
   * @param {string|mongoose.Types.ObjectId} invitationId - The ID of the invitation.
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the requesting user.
   * @returns {Promise<Object>} The revoked invitation document.
   * @throws {AppError} If unauthorized or invitation not found.
   */
  async revokeInvitation(invitationId, userId) {
    const invite = await Invitation.findById(invitationId);
    if (!invite) throw new AppError("Invitation not found", 404);

    const board = await Board.findById(invite.boardId);
    if (!board) throw new AppError("Board not found", 404);

    // Only board owner or admins can revoke
    if (board.owner.toString() !== userId.toString()) {
      throw new AppError("Unauthorized to revoke invitations", 403);
    }

    invite.status = "revoked";
    await invite.save();
    return invite;
  }

  /**
   * Resends the email for a currently pending targeted invitation.
   * 
   * @param {string|mongoose.Types.ObjectId} invitationId - The ID of the pending invitation.
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the requesting user.
   * @param {string} [clientOrigin] - The frontend URL origin.
   * @returns {Promise<Object>} The invitation document.
   * @throws {AppError} If unauthorized, invitation not found, or not pending.
   */
  async resendInvitation(invitationId, userId, clientOrigin) {
    const invite = await Invitation.findById(invitationId);
    if (!invite || invite.status !== "pending") {
      throw new AppError("Active pending invitation not found", 404);
    }

    const board = await Board.findById(invite.boardId).populate("owner", "name");
    if (!board) throw new AppError("Board not found", 404);

    if (board.owner.toString() !== userId.toString()) {
      throw new AppError("Unauthorized to resend invitations", 403);
    }

    const frontendUrl = clientOrigin || process.env.FRONTEND_URL || "http://localhost:5173";
    const inviteUrl = `${frontendUrl}/b/invite/individual/${invite.token}`;

    const html = `
      <div style="background-color: #09090b; padding: 48px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #f4f4f5; text-align: center; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); max-width: 500px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); width: 56px; height: 56px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);">
          <span style="font-size: 28px; color: #fff; font-weight: bold; line-height: 56px; display: block; text-align: center; width: 100%;">⚡</span>
        </div>
        <h1 style="font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 8px 0; letter-spacing: -0.025em; text-transform: uppercase;">REMINDER: BOARD INVITATION</h1>
        <p style="font-size: 10px; color: #8b5cf6; margin: 0 0 24px 0; text-transform: uppercase; font-weight: bold; letter-spacing: 0.15em;">Gated Targeted Access</p>
        <p style="font-size: 14px; color: #a1a1aa; line-height: 1.6; margin: 0 0 32px 0;">
          This is a friendly reminder that <strong style="color: #fff;">${board.owner.name}</strong> has invited you to collaborate as an <strong style="color: #8b5cf6; text-transform: uppercase;">${invite.role}</strong> on their board: <br/>
          <strong style="color: #fff; font-size: 16px;">${board.title}</strong>
        </p>
        <a href="${inviteUrl}" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; text-decoration: none; padding: 14px 32px; font-size: 13px; font-weight: bold; border-radius: 12px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);">Accept Invitation</a>
        <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
          <p style="font-size: 11px; color: #52525b; line-height: 1.5; margin: 0;">
            This invitation was specifically generated for <strong>${invite.email}</strong>.
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: invite.email,
        subject: `REMINDER: Invitation to collaborate on: ${board.title}`,
        message: `Reminder: Join ${board.title} as ${invite.role} at ${inviteUrl}`,
        html,
      });
    } catch (error) {
      console.error("Failed to resend targeted invite email", error);
      throw new AppError("Failed to send targeted email reminder", 500);
    }

    return invite;
  }

  /**
   * Processes the acceptance of a targeted individual invitation.
   * Adds the user to the board and workspace with the specified role.
   * 
   * @param {string} token - The unique token for the targeted invitation.
   * @param {string|mongoose.Types.ObjectId} userId - The ID of the user accepting the invite.
   * @returns {Promise<Object>} Object containing the joined boardId.
   * @throws {AppError} If invitation is invalid, expired, or revoked.
   */
  async acceptInvitation(token, userId) {
    const invite = await Invitation.findOne({ token, status: "pending" });
    if (!invite) throw new AppError("Invalid, expired, or revoked invitation link", 404);

    const board = await Board.findById(invite.boardId);
    if (!board) throw new AppError("Board not found", 404);

    if (
      !board.members.includes(userId) &&
      board.owner.toString() !== userId.toString()
    ) {
      board.members.push(userId);
      await board.save();

      if (board.workspaceId) {
        const workspace = await Workspace.findById(board.workspaceId);
        if (workspace) {
          const isAlreadyMember = workspace.members.some(
            m => (m.user?._id || m.user).toString() === userId.toString()
          );
          if (!isAlreadyMember) {
            workspace.members.push({ user: userId, role: invite.role });
            await workspace.save();
          } else {
            // Update role if they are already in the workspace to respect invitation tier
            await Workspace.updateOne(
              { _id: board.workspaceId, "members.user": userId },
              { $set: { "members.$.role": invite.role } }
            );
          }
        }
      }
    }

    invite.status = "accepted";
    await invite.save();

    return { boardId: board._id };
  }
}

export default new BoardService();
