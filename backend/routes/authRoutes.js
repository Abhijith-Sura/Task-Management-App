import express from "express";
import {register,login,getProfile,getMyActivity,verifyEmail,forgotPassword,resetPassword,verifyOtp,resendOtp} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @module AuthRoutes
 * @description Express routes for user authentication, profile management, and password recovery.
 */

/**
 * @route POST /register
 * @description Registers a new user account.
 * @access Public
 */
router.post("/register",register);

/**
 * @route POST /login
 * @description Authenticates a user and returns a token or triggers two-factor OTP verification.
 * @access Public
 */
router.post("/login",login);

/**
 * @route POST /verify-otp
 * @description Verifies the one-time password (OTP) provided by the user.
 * @access Public
 */
router.post("/verify-otp", verifyOtp);

/**
 * @route POST /resend-otp
 * @description Resends the OTP to the user's registered communication channel.
 * @access Public
 */
router.post("/resend-otp", resendOtp);

/**
 * @route GET /profile
 * @description Retrieves the profile details of the currently authenticated user.
 * @access Private
 */
router.get("/profile", authMiddleware, getProfile);

/**
 * @route GET /activity
 * @description Fetches recent activity logs tied to the authenticated user.
 * @access Private
 */
router.get("/activity", authMiddleware, getMyActivity);

/**
 * @route GET /verify-email/:token
 * @description Verifies a user's email address using the token sent to their inbox.
 * @access Public
 */
router.get("/verify-email/:token", verifyEmail);

/**
 * @route POST /forgot-password
 * @description Initiates the password reset flow by emailing a recovery link.
 * @access Public
 */
router.post("/forgot-password", forgotPassword);

/**
 * @route PUT /reset-password/:token
 * @description Finalizes resetting the user's password using a valid recovery token.
 * @access Public
 */
router.put("/reset-password/:token", resetPassword);

export default router;