import express from "express";
import { generateSubtasks, summarizeDiscussion } from "../controllers/aiController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @module AIRoutes
 * @description Defines Express routes for AI-powered features. All routes require authentication.
 */

// Gated routes: only authenticated session users can trigger operations
/**
 * @route POST /generate-subtasks
 * @description Generates a list of subtasks using AI based on provided task details.
 * @access Private
 */
router.post("/generate-subtasks", authMiddleware, generateSubtasks);

/**
 * @route POST /summarize-discussion
 * @description Summarizes a long discussion or thread of comments using AI.
 * @access Private
 */
router.post("/summarize-discussion", authMiddleware, summarizeDiscussion);

export default router;
