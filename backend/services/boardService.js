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
 * @desc    Board Related Business Logic
 */
class BoardService {
  /**
   * @desc    Create a new board
   */
  async createBoard(data, userId) {
    let { title, workspaceId, category } = data;

    if (!workspaceId) {
      let personal = await Workspace.findOne({ owner: userId, name: "Personal" });
      
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
      category: category || "General"
    });
  }

  /**
   * @desc    Create a new board deep-cloning an enterprise template config
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
   * @desc    Get all boards for a user (owned or member)
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
   * @desc    Get board by ID with full details (populated lists and cards)
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

    // Add comment counts to each card
    for (const list of board.lists) {
      for (const card of list.cards) {
        card.commentCount = await Comment.countDocuments({ cardId: card._id });
      }
    }

    return board;
  }

  /**
   * @desc    Update board (title, etc.)
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
   * @desc    Invite a member to a board by email.
   *          If the user is already registered, they are added directly.
   *          If not registered, a targeted invitation email is sent so they
   *          can sign up and join the board seamlessly.
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
   * @desc    Delete a board and all its associated lists and cards
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
   * @desc    Generate an invite link for a board
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
   * @desc    Reset and revoke current invite link
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
   * @desc    Join a board via invite link
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
   * @desc    Send an email invitation to join a board
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
   * @desc    Create a new targeted individual invitation
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
   * @desc    Get all pending invitations for a board
   */
  async getInvitations(boardId) {
    return await Invitation.find({ boardId, status: "pending" })
      .populate("invitedBy", "name email avatar")
      .sort("-createdAt");
  }

  /**
   * @desc    Revoke/Cancel a targeted invitation
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
   * @desc    Resend a pending targeted invitation
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
   * @desc    Accept a targeted invitation
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
