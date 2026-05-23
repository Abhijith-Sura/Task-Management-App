import mongoose from "mongoose";
import dotenv from "dotenv";
import Board from "./models/Board.js";
import Workspace from "./models/Workspace.js";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";
  await mongoose.connect(mongoUri);
  const boardId = "69b8f5c89a3b65263912e171";
  const board = await Board.findById(boardId).populate("workspaceId").lean();
  console.log("Board:", board);
  if (board && board.workspaceId) {
    console.log("Workspace:", board.workspaceId);
  } else {
    console.log("Board has no workspace or not found");
  }
  process.exit(0);
}

run().catch(console.error);
