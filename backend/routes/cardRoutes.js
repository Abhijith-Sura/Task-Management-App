import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadAttachment } from "../controllers/cardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", authMiddleware, upload.single("file"), uploadAttachment);

export default router;