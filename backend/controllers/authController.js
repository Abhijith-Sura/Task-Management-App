import authService from "../services/authService.js";
import Activity from "../models/Activity.js";
import asyncHandler from "../utils/asyncHandler.js";
import { successResponse } from "../utils/apiResponse.js";

/**
 * Registers a new user account and provisions initial resources.
 * 
 * @route   POST /api/auth/register
 * @param {import("express").Request} req - The Express request object containing user registration details.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the newly created user data.
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return successResponse(res, result, "User registered successfully", 201);
});

/**
 * Authenticates a user using email and password, returning a session token or user payload.
 * 
 * @route   POST /api/auth/login
 * @param {import("express").Request} req - The Express request object containing `email` and `password`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the login result.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return successResponse(res, result, "Login successful");
});

/**
 * Verifies a One-Time Password (OTP) for secondary authentication.
 * 
 * @route   POST /api/auth/verify-otp
 * @param {import("express").Request} req - The Express request object containing `email` and `otp`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If `email` or `otp` is missing.
 * @returns {Promise<void>} Sends a success response confirming authentication.
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
 * Resends a new One-Time Password (OTP) to the specified email address.
 * 
 * @route   POST /api/auth/resend-otp
 * @param {import("express").Request} req - The Express request object containing the `email`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If `email` is missing.
 * @returns {Promise<void>} Sends a success response indicating the OTP was resent.
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
 * Retrieves the currently authenticated user's profile.
 * 
 * @route   GET /api/auth/profile
 * @param {import("express").Request} req - The Express request object.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response containing the user profile.
 */
export const getProfile = asyncHandler(async (req, res) => {
  // User payload is extracted and attached to req by the authentication middleware
  return successResponse(res, req.user);
});

/**
 * Retrieves the current user's global activity history across all boards.
 * Used primarily for generating activity charts or heatmaps.
 * 
 * @route   GET /api/auth/activity
 * @param {import("express").Request} req - The Express request object.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response with the list of activities.
 */
export const getMyActivity = asyncHandler(async (req, res) => {
  // Fetch a sufficiently large batch of recent activities to populate long-term views (e.g., a 28-day heatmap)
  const activities = await Activity.find({ user: req.user.id })
    .sort("-createdAt")
    .limit(500);
  return successResponse(res, activities);
});

/**
 * Verifies a user's email address using a secure token.
 * 
 * @route   GET /api/auth/verify-email/:token
 * @param {import("express").Request} req - The Express request object containing the verification `token`.
 * @param {import("express").Response} res - The Express response object.
 * @returns {Promise<void>} Sends a success response confirming email verification.
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const result = await authService.verifyEmail(req.params.token);
  return successResponse(res, result, "Email verified successfully");
});

/**
 * Initiates the password reset workflow by sending a recovery email.
 * 
 * @route   POST /api/auth/forgot-password
 * @param {import("express").Request} req - The Express request object containing the user's `email`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If `email` is not provided.
 * @returns {Promise<void>} Sends a success response confirming the email was dispatched.
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
 * Resets a user's password using a valid recovery token.
 * 
 * @route   PUT /api/auth/reset-password/:token
 * @param {import("express").Request} req - The Express request object containing the new `password` and recovery `token`.
 * @param {import("express").Response} res - The Express response object.
 * @throws {Error} If the new `password` is missing.
 * @returns {Promise<void>} Sends a success response confirming the password update.
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw new Error("Please provide a new password");
  }
  const result = await authService.resetPassword(req.params.token, password);
  return successResponse(res, result, "Password reset successfully");
});