import express from "express";
import { generateSubtasks, summarizeDiscussion } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Gated routes: only authenticated session users can trigger operations
router.post("/generate-subtasks", authMiddleware, generateSubtasks);
router.post("/summarize-discussion", authMiddleware, summarizeDiscussion);

export default router;
