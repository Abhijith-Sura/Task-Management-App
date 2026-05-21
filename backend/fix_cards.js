import mongoose from "mongoose";
import dotenv from "dotenv";
import Card from "./models/Card.js";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/taskmanager";
  console.log("Connecting to:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  // Find all raw cards directly from MongoDB collection
  const cards = await Card.collection.find({}).toArray();
  console.log(`Total cards in DB: ${cards.length}`);

  let repairedCount = 0;
  for (const card of cards) {
    let needsRepair = false;

    // Check if attachments is not an array (e.g. if it is a primitive string or something else)
    if (card.attachments && !Array.isArray(card.attachments)) {
      console.log(`Card "${card.title}" (${card._id}) has non-array attachments:`, card.attachments);
      needsRepair = true;
    }

    // Also check if any card's attachments contains string elements instead of objects
    if (Array.isArray(card.attachments)) {
      const hasPrimitives = card.attachments.some(att => typeof att === "string" || att === null);
      if (hasPrimitives) {
        console.log(`Card "${card.title}" (${card._id}) has primitive attachments:`, card.attachments);
        needsRepair = true;
      }
    }

    if (needsRepair) {
      console.log(`Repairing card: ${card.title} (${card._id})...`);
      
      // Let's safe-cast whatever is there to a valid attachments array structure or reset it to []
      let validAttachments = [];
      if (typeof card.attachments === "string" && card.attachments.trim() !== "") {
        validAttachments.push({
          name: card.attachments.split(/[\\/]/).pop() || "Attachment",
          url: card.attachments,
          size: 0,
          mimeType: "application/pdf"
        });
      } else if (Array.isArray(card.attachments)) {
        card.attachments.forEach(att => {
          if (typeof att === "string") {
            validAttachments.push({
              name: att.split(/[\\/]/).pop() || "Attachment",
              url: att,
              size: 0,
              mimeType: "application/pdf"
            });
          } else if (att && typeof att === "object") {
            validAttachments.push(att);
          }
        });
      }

      // Bypass mongoose schema checks temporarily by running raw MongoDB update
      await Card.collection.updateOne(
        { _id: card._id },
        { $set: { attachments: validAttachments } }
      );
      
      console.log(`Card "${card.title}" repaired successfully!`);
      repairedCount++;
    }
  }

  console.log(`Migration completed successfully! Repaired ${repairedCount} cards.`);
  process.exit(0);
}

run().catch(console.error);
