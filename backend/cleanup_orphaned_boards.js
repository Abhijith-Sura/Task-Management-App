import mongoose from "mongoose";
import dotenv from "dotenv";
import Workspace from "./models/Workspace.js";
import Board from "./models/Board.js";
import List from "./models/List.js";
import Card from "./models/Card.js";
import Invitation from "./models/Invitation.js";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";
  console.log("Connecting to:", mongoUri.split('@')[1] || mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  const workspaces = await Workspace.find().select("_id").lean();
  const workspaceIds = workspaces.map(w => w._id.toString());
  console.log(`Total workspaces in DB: ${workspaces.length}`);

  const boards = await Board.find().lean();
  console.log(`Total boards in DB: ${boards.length}`);

  let orphanedBoards = [];
  for (const board of boards) {
    if (!board.workspaceId || !workspaceIds.includes(board.workspaceId.toString())) {
      orphanedBoards.push(board);
    }
  }

  console.log(`Found ${orphanedBoards.length} orphaned boards.`);

  for (const board of orphanedBoards) {
    console.log(`Cleaning up orphaned board: ${board.title} (${board._id})`);
    
    // Find all lists belonging to this board
    const lists = await List.find({ boardId: board._id }).select("_id").lean();
    const listIds = lists.map(l => l._id);

    // Cascade delete: cards -> lists -> invitations -> boards
    if (listIds.length > 0) {
      const cardDel = await Card.deleteMany({ listId: { $in: listIds } });
      const listDel = await List.deleteMany({ boardId: board._id });
      console.log(`  Deleted ${cardDel.deletedCount} cards, ${listDel.deletedCount} lists.`);
    }
    
    const invDel = await Invitation.deleteMany({ boardId: board._id });
    const boardDel = await Board.findByIdAndDelete(board._id);
    
    console.log(`  Deleted ${invDel.deletedCount} invitations, 1 board.`);
  }

  console.log(`Cleanup completed successfully! Removed ${orphanedBoards.length} orphaned boards.`);
  process.exit(0);
}

run().catch(err => {
  console.error("Cleanup failed:", err);
  process.exit(1);
});
