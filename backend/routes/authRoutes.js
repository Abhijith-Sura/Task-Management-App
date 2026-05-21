import express from "express";
import {register,login,getProfile,getMyActivity,verifyEmail,forgotPassword,resetPassword,verifyOtp,resendOtp} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register",register);
router.post("/login",login);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.get("/profile", authMiddleware, getProfile);
router.get("/activity", authMiddleware, getMyActivity);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;