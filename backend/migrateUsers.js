import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/taskmanagement")
  .then(async () => {
    console.log("Connected to MongoDB");
    const result = await User.updateMany(
      { isVerified: { $ne: true } },
      { $set: { isVerified: true } }
    );
    console.log(`Updated ${result.modifiedCount} users to be verified.`);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
