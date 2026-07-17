import User from "../models/User.js";
import OTP from "../models/OTP.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

// Generate random 6-digit OTP
const generateOTPCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @desc    Register a new user (Status: Pending verification)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = async (req, res, next) => {
  const { fullName, email, mobileNumber, password, agreeTerms } = req.body;

  try {
    // Validate required fields
    if (!fullName || !email || !mobileNumber || !password) {
      res.status(400);
      throw new Error("Please fill in all required fields");
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      if (userExists.isVerified) {
        res.status(400);
        throw new Error("User already exists with this email");
      } else {
        // If user registered but never verified, we can update their registration info
        userExists.fullName = fullName;
        userExists.mobileNumber = mobileNumber;
        userExists.password = password;
        userExists.agreeTerms = agreeTerms;
        await userExists.save();
      }
    } else {
      // Create new user (pending verification)
      await User.create({
        fullName,
        email,
        mobileNumber,
        password,
        agreeTerms,
        isVerified: false,
      });
    }

    // Generate 6-digit OTP
    const otpCode = generateOTPCode();

    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });

    // Save OTP to database
    await OTP.create({
      email,
      code: otpCode,
    });

    // Send email with OTP code
    const emailSubject = "Verify your Maison Aevum Account";
    const emailText = `Welcome to Aevum, ${fullName}.\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2DFD8; background-color: #FDFAF4;">
        <h2 style="color: #13110F; text-align: center; font-family: Georgia, serif;">MAISON AEVUM</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for initiating your journey with Maison Aevum. To verify your email address, please enter the following 6-digit verification code:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #13110F;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #72706F; text-align: center;">This code will expire in 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #E2DFD8; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9B9694; text-align: center;">If you did not make this request, please ignore this email.</p>
      </div>
    `;

    // Send email asynchronously in the background so registration is instant
    sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }).catch((err) => console.error(`Background email send error: ${err.message}`));

    res.status(201).json({
      success: true,
      message: "Registration initiated. Verification OTP code has been sent.",
      email,
      ...(process.env.NODE_ENV === "development" && { devOtp: otpCode }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email with OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
export const verifyOTP = async (req, res, next) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      res.status(400);
      throw new Error("Email and verification code are required");
    }

    // Find the latest OTP record for this email
    const otpRecord = await OTP.findOne({ email }).sort({ createdAt: -1 });

    if (!otpRecord) {
      res.status(400);
      throw new Error("Verification code has expired or is invalid");
    }

    // Check if code matches (allow 999999 bypass in development or if explicitly allowed by env)
    const isBypassAllowed = (process.env.NODE_ENV === "development" && code === "999999") || 
                            (process.env.ALLOW_OTP_BYPASS === "true" && code === "999999");
    if (otpRecord.code !== code && !isBypassAllowed) {
      res.status(400);
      throw new Error("Incorrect verification code");
    }

    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error("User associated with this code was not found");
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete the OTP code
    await OTP.deleteMany({ email });

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend OTP code
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
export const resendOTP = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("No account registered under this email");
    }

    // Generate new OTP
    const otpCode = generateOTPCode();

    // Delete existing OTPs
    await OTP.deleteMany({ email });

    // Save to DB
    await OTP.create({
      email,
      code: otpCode,
    });

    // Send email
    const emailSubject = "Your new Maison Aevum Verification Code";
    const emailText = `Your new 6-digit verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #E2DFD8; background-color: #FDFAF4;">
        <h2 style="color: #13110F; text-align: center; font-family: Georgia, serif;">MAISON AEVUM</h2>
        <p>Dear ${user.fullName},</p>
        <p>As requested, here is your new 6-digit verification code:</p>
        <div style="font-size: 24px; font-weight: bold; text-align: center; margin: 30px 0; letter-spacing: 5px; color: #13110F;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #72706F; text-align: center;">This code will expire in 5 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #E2DFD8; margin: 30px 0;" />
        <p style="font-size: 11px; color: #9B9694; text-align: center;">If you did not make this request, please ignore this email.</p>
      </div>
    `;

    // Send email asynchronously in the background
    sendEmail({
      to: email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
    }).catch((err) => console.error(`Background email send error: ${err.message}`));

    res.status(200).json({
      success: true,
      message: "Verification code resent successfully.",
      ...(process.env.NODE_ENV === "development" && { devOtp: otpCode }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & generate token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      throw new Error("Please enter both email and password");
    }

    // Find user by email and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error("Invalid email or password");
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate OTP code for them to complete verification
      const otpCode = generateOTPCode();
      await OTP.deleteMany({ email });
      await OTP.create({ email, code: otpCode });

      // Log OTP and send
      // Send email asynchronously in the background
      sendEmail({
        to: email,
        subject: "Verify your Maison Aevum Account",
        text: `Your verification code is: ${otpCode}`,
      }).catch((err) => console.error(`Background email send error: ${err.message}`));

      return res.status(403).json({
        success: false,
        message: "Email is not verified. A verification code has been sent to your email.",
        email,
        requiresVerification: true,
        ...(process.env.NODE_ENV === "development" && { devOtp: otpCode }),
      });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request Password Reset (Simulated/Real)
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error("Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("No account found with this email");
    }

    // We can generate a 6-digit reset code
    const resetCode = generateOTPCode();
    await OTP.deleteMany({ email });
    await OTP.create({ email, code: resetCode });

    // Send reset instructions
    const subject = "Reset your Maison Aevum Password";
    const text = `To reset your password, please use the verification code: ${resetCode}\n\nIf you did not request a password reset, please ignore this email.`;
    
    // Send email asynchronously in the background
    sendEmail({ to: email, subject, text }).catch((err) =>
      console.error(`Background email send error: ${err.message}`)
    );

    res.status(200).json({
      success: true,
      message: "Password reset instructions sent.",
      email,
      ...(process.env.NODE_ENV === "development" && { devOtp: resetCode }),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPassword = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    // Update password (pre-save hook hashes it)
    user.password = password;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};
