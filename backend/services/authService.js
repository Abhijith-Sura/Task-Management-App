import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";

/**
 * @desc    Auth Related Business Logic
 */
class AuthService {
  /**
   * @desc    Send beautiful secure OTP email
   */
  async sendOtpEmail(email, otp) {
    console.log(`
  =============================================================
  🔑 [SECURITY AUTHORIZATION KEY GENERATED]
  =============================================================
  OPERATOR:  ${email}
  SYNC KEY:  ${otp}
  EXPIRY:    15 MINUTES
  STATUS:    TRANSMITTING SECURE PROTOCOL EMAIL...
  =============================================================
    `);

    const html = `
      <div style="background-color: #020204; color: #cbd5e1; font-family: 'Courier New', Courier, monospace; padding: 40px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.05); max-width: 600px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 12px; background-color: rgba(79, 70, 229, 0.1); border: 1px solid rgba(79, 70, 229, 0.2); border-radius: 8px; margin-bottom: 12px;">
            <span style="font-size: 24px; color: #4F46E5; font-weight: bold;">▲ ZENITH</span>
          </div>
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 2px;">AUTHORIZATION_REQUIRED</h2>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 5px; text-transform: uppercase;">OPERATOR PROVISIONING PROTOCOL</p>
        </div>
        <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); padding: 24px; border-radius: 8px; margin-bottom: 30px; text-align: center;">
          <p style="font-size: 14px; margin-bottom: 20px; color: #e2e8f0;">To finalize provisioning and establish your secure engineering session, enter the following 6-digit cryptographic security key:</p>
          <div style="font-size: 36px; font-weight: bold; color: #ffffff; letter-spacing: 6px; background-color: rgba(79, 70, 229, 0.05); border: 1px solid rgba(79, 70, 229, 0.2); padding: 15px 30px; border-radius: 6px; display: inline-block; margin-bottom: 15px; box-shadow: 0 0 15px rgba(79, 70, 229, 0.15);">
            ${otp}
          </div>
          <p style="font-size: 11px; color: #f59e0b; margin-top: 5px; text-transform: uppercase;">⚠️ THIS KEY WILL EXPIRE IN 15 MINUTES</p>
        </div>
        <div style="font-size: 12px; color: #64748b; line-height: 1.6; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 20px;">
          <p style="margin: 0 0 10px 0;">If you did not initiate this registration request, please disregard this transmission immediately.</p>
          <p style="margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #475569;">SECURE NODE: v2.0.4-STABLE // ENCRYPTION: AES-256</p>
        </div>
      </div>
    `;

    await sendEmail({
      email,
      subject: "▲ ZENITH | SECURE_AUTHORIZATION_KEY",
      message: `Your cryptographic authorization key is: ${otp}. This key expires in 15 minutes.`,
      html,
    });
  }

  /**
   * @desc    Register a new user
   */
  async register(data) {
    const { name, email, password } = data;

    const existingUser = await User.findOne({ email });

    // --- Handle already-registered but UNVERIFIED user ---
    // This happens when SMTP fails on first registration attempt.
    // Instead of a 500 error, we resend the OTP so they can verify.
    if (existingUser && !existingUser.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpire = Date.now() + 15 * 60 * 1000;
      existingUser.verificationToken = otp;
      existingUser.verificationExpire = otpExpire;
      await existingUser.save();

      let emailSent = true;
      try {
        await this.sendOtpEmail(existingUser.email, otp);
      } catch (err) {
        console.error("Failed to send verification email:", err.message);
        emailSent = false;
      }

      return {
        verified: false,
        email: existingUser.email,
        message: emailSent
          ? "Account already registered but unverified. Fresh authorization key sent to your email."
          : "Account already registered but unverified. [SMTP ERROR] Check Render logs for the authorization key!",
      };
    }

    // --- Handle fully registered and verified user ---
    if (existingUser && existingUser.isVerified) {
      const err = new Error("An account with this email already exists. Please log in.");
      err.statusCode = 400;
      throw err;
    }

    // --- Create fresh new user ---
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    const user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      verificationToken: otp,
      verificationExpire: otpExpire,
    });

    let emailSent = true;
    try {
      await this.sendOtpEmail(user.email, otp);
    } catch (err) {
      console.error("Failed to send verification email:", err.message);
      emailSent = false;
    }

    return {
      verified: false,
      email: user.email,
      message: emailSent
        ? "Operator profile created. Authorization key sent to your email."
        : "Operator profile created. [SMTP ERROR] Check Render logs for the authorization key!",
    };
  }

  /**
   * @desc    Login user
   */
  async login(email, password) {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      if (user.isVerified === false) {
        // Automatically generate and dispatch a new OTP on unverified login attempt
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = Date.now() + 15 * 60 * 1000;

        user.verificationToken = otp;
        user.verificationExpire = otpExpire;
        await user.save();

        let emailSent = true;
        try {
          await this.sendOtpEmail(user.email, otp);
        } catch (err) {
          console.error("Failed to send verification email:", err.message);
          emailSent = false;
        }

        return {
          verified: false,
          email: user.email,
          message: emailSent
            ? "Operator profile is unverified. Fresh authorization key dispatched."
            : "Operator profile is unverified. [SMTP ERROR] Check Render logs for the fresh key!",
        };
      }

      const token = this.generateToken(user._id);
      return {
        verified: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        token,
      };
    } else {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * @desc    Verify OTP code
   */
  async verifyOtp(email, otp) {
    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      const err = new Error("Invalid or expired authorization key.");
      err.statusCode = 400;
      throw err;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    const token = this.generateToken(user._id);

    return {
      verified: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      token,
      message: "Operator identity verified successfully. Session initiated.",
    };
  }

  /**
   * @desc    Resend OTP code
   */
  async resendOtp(email) {
    const user = await User.findOne({ email });

    if (!user) {
      const err = new Error("Operator profile not found.");
      err.statusCode = 404;
      throw err;
    }

    if (user.isVerified) {
      const err = new Error("Operator profile is already verified.");
      err.statusCode = 400;
      throw err;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 15 * 60 * 1000;

    user.verificationToken = otp;
    user.verificationExpire = otpExpire;
    await user.save();

    let emailSent = true;
    try {
      await this.sendOtpEmail(user.email, otp);
    } catch (err) {
      console.error("Failed to send verification email:", err.message);
      emailSent = false;
    }

    return {
      success: true,
      message: emailSent
        ? "Fresh cryptographic authorization key dispatched."
        : "Fresh key generated! Check backend console/terminal for the key.",
    };
  }

  /**
   * @desc    Generate JWT Token
   */
  generateToken(id) {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
  }

  async verifyEmail(token) {
    const user = await User.findOne({
      verificationToken: token,
      verificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired verification token");
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpire = undefined;
    await user.save();

    return { message: "Email verified successfully" };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User with that email does not exist");
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const html = `<h1>Password Reset</h1><p>Please click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message: resetUrl,
        html,
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      throw new Error("Email could not be sent");
    }

    return { message: "Password reset email sent" };
  }

  async resetPassword(token, newPassword) {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    return { message: "Password updated successfully" };
  }
}

export default new AuthService();
