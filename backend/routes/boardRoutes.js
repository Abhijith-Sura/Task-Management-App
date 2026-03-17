import express from "express";
import {createBoard,getBoards,inviteMember} from "../controllers/boardController.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/",authMiddleware,createBoard);
router.get("/",authMiddleware,getBoards);
router.put("/invite",authMiddleware,inviteMember);

export default router;