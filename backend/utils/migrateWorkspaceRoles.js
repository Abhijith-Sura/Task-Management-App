import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";

/**
 * @desc    Self-healing migration to convert legacy workspace.members array to RBAC objects
 */
export const migrateWorkspaceRoles = async () => {
  try {
    const workspaces = await Workspace.find();
    let migratedCount = 0;

    for (const workspace of workspaces) {
      let needsMigration = false;
      const updatedMembers = [];

      for (const member of workspace.members) {
        // If member is a direct ObjectId or string, it lacks the 'user' field structure
        if (!member || typeof member !== 'object' || !member.user) {
          needsMigration = true;
          const userId = (member && typeof member === 'object' && member._id) ? member._id : member;
          
          if (userId) {
            const role = userId.toString() === workspace.owner.toString() ? "admin" : "editor";
            updatedMembers.push({ user: userId, role });
          }
        } else {
          updatedMembers.push(member);
        }
      }

      // Ensure owner is always explicitly in the members list with admin role
      const hasOwner = updatedMembers.some(m => m.user && m.user.toString() === workspace.owner.toString());
      if (!hasOwner) {
        needsMigration = true;
        updatedMembers.unshift({ user: workspace.owner, role: "admin" });
      }

      if (needsMigration) {
        workspace.members = updatedMembers;
        await workspace.save();
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ DATABASE_MIGRATION: Successfully migrated roles for ${migratedCount} legacy workspaces.`);
    }
  } catch (error) {
    console.error("❌ DATABASE_MIGRATION_FAILED:", error);
  }
};
