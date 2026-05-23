import mongoose from "mongoose";
import crypto from "crypto";
import dotenv from "dotenv";
import Board from "./models/Board.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected!");

  const boards = await Board.find({ inviteToken: { $in: [null, undefined, ""] } });
  console.log(`Found ${boards.length} boards missing an inviteToken.`);

  for (const board of boards) {
    board.inviteToken = crypto.randomBytes(20).toString("hex");
    await board.save();
    console.log(`  Fixed board: ${board.title} (${board._id})`);
  }

  console.log("Done! All boards now have unique invite tokens.");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
