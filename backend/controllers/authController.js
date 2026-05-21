import authService from "../services/authService.js";
import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return successResponse(res, result, "User registered successfully", 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return successResponse(res, result, "Login successful");
});

/**
 * @desc    Verify OTP Code
 * @route   POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    throw new Error("Please provide email and authorization code.");
  }
  const result = await authService.verifyOtp(email, otp);
  return successResponse(res, result, "Operator authenticated successfully.");
});

/**
 * @desc    Resend OTP Code
 * @route   POST /api/auth/resend-otp
 */
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new Error("Please provide email.");
  }
  const result = await authService.resendOtp(email);
  return successResponse(res, result, "Fresh authorization key sent.");
});

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  // User is already attached to req by authMiddleware
  return successResponse(res, req.user);
});

/**
 * @desc    Get user's global activity
 * @route   GET /api/auth/activity
 */
export const getMyActivity = asyncHandler(async (req, res) => {
  const activities = await Activity.find({ user: req.user.id })
    .sort("-createdAt")
    .limit(500); // Fetch enough to build a 28-day heatmap
  return successResponse(res, activities);
});

/**
 * @desc    Verify Email
 * @route   GET /api/auth/verify-email/:token
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  return successResponse(res, result, "Email verified successfully");
});

/**
 * @desc    Forgot Password
 * @route   POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new Error("Please provide an email");
  }
  const result = await authService.forgotPassword(email);
  return successResponse(res, result, "Password reset email sent");
});

/**
 * @desc    Reset Password
 * @route   PUT /api/auth/reset-password/:token
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw new Error("Please provide a new password");
  }
  const result = await authService.resetPassword(req.params.token, password);
  return successResponse(res, result, "Password reset successfully");
});