import express from "express";
import { createList, getLists } from "../controllers/listController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createList);

router.get("/:boardId", authMiddleware, getLists);

export default router;