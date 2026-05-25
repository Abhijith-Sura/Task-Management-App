import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Mongoose schema representing an application user.
 * Stores authentication credentials, profile information, and account lifecycle state.
 *
 * @typedef {mongoose.Schema} UserSchema
 */
const userSchema = new mongoose.Schema({
  /**
   * The user's full name or display name.
   */
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  /**
   * The user's primary email address used for authentication and communications.
   * Enforces uniqueness to prevent duplicate accounts.
   */
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
  },
  /**
   * The securely hashed user password.
   * Stored as a bcrypt hash, never in plain text.
   */
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6,
  },
  /**
   * URL pointing to the user's uploaded profile avatar or a default gravatar image.
   */
  avatar: String,
  /**
   * Indicates whether the user has verified their email address via a verification token.
   */
  isVerified: {
    type: Boolean,
    default: false,
  },
  /**
   * Temporary token used for email verification upon registration.
   */
  verificationToken: String,
  /**
   * Expiration timestamp for the email verification token.
   */
  verificationExpire: Date,
  /**
   * Temporary token used to authorize a password reset request.
   */
  resetPasswordToken: String,
  /**
   * Expiration timestamp for the password reset token.
   */
  resetPasswordExpire: Date,
}, { timestamps: true });

/**
 * Pre-save middleware to automatically hash passwords before persisting to the database.
 * Skips hashing if the password field hasn't been modified (e.g., during profile updates).
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare a plain text password against the hashed password stored in the database.
 * 
 * @param {string} enteredPassword - The plain text password provided by the user during login.
 * @returns {Promise<boolean>} Resolves to true if passwords match, otherwise false.
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Mongoose model for the User collection.
 * 
 * @module models/User
 */
export default mongoose.model("User", userSchema);