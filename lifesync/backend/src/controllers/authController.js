import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail, sendOtpEmail } from "../utils/mail.js";

// Cookie options for secure storage of refresh tokens
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
};

const generate6DigitOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existedUser = await User.findOne({ email });

  if (existedUser && existedUser.isVerified) {
    throw new ApiError(409, "User with this email already exists");
  }

  const otp = generate6DigitOtp();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user;
  if (existedUser && !existedUser.isVerified) {
    existedUser.name = name;
    existedUser.password = password;
    existedUser.otp = otp;
    existedUser.otpExpire = otpExpire;
    await existedUser.save();
    user = existedUser;
  } else {
    user = await User.create({
      name,
      email,
      password,
      isVerified: false,
      otp,
      otpExpire,
    });
  }

  // Dispatch OTP Email and track delivery
  let emailDelivered = false;
  let emailWarning = null;
  try {
    const emailResult = await sendOtpEmail(email, otp, "Signup Verification");
    emailDelivered = emailResult?.delivered === true;
    if (!emailDelivered) {
      emailWarning = emailResult?.reason === "no_smtp_config"
        ? "Email service is not configured. OTP was logged on the server console."
        : `Email delivery failed: ${emailResult?.error || "Unknown error"}. OTP was logged on the server console.`;
    }
  } catch (emailError) {
    console.error("⚠️ OTP email dispatch error:", emailError.message || emailError);
    emailWarning = `Email delivery failed: ${emailError.message || "Unknown error"}`;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { requiresOtp: true, email: user.email, emailDelivered, ...(emailWarning && { emailWarning }) },
      emailDelivered
        ? "Registration initiated. Verification OTP sent to your email."
        : "Registration initiated. OTP generated but email delivery failed — check server logs."
    )
  );
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  if (!user.otp || user.otp !== otp.toString().trim()) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (!user.otpExpire || new Date(user.otpExpire) < new Date()) {
    throw new ApiError(400, "OTP code has expired. Please request a new one.");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const verifiedUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire -otp -otpExpire"
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: verifiedUser, accessToken },
        "OTP verified successfully. Welcome to LifeSync!"
      )
    );
});

const sendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "Verification" } = req.body;

  if (!email) {
    throw new ApiError(400, "Email address is required");
  }

  let user = await User.findOne({ email });

  const otp = generate6DigitOtp();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  if (!user) {
    user = await User.create({
      name: email.split("@")[0],
      email,
      isVerified: false,
      otp,
      otpExpire,
    });
  } else {
    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save({ validateBeforeSave: false });
  }

  let emailDelivered = false;
  let emailWarning = null;
  try {
    const emailResult = await sendOtpEmail(email, otp, purpose);
    emailDelivered = emailResult?.delivered === true;
    if (!emailDelivered) {
      emailWarning = emailResult?.reason === "no_smtp_config"
        ? "Email service is not configured. OTP was logged on the server console."
        : `Email delivery failed: ${emailResult?.error || "Unknown error"}. OTP was logged on the server console.`;
    }
  } catch (emailError) {
    console.error("⚠️ OTP email dispatch error:", emailError.message || emailError);
    emailWarning = `Email delivery failed: ${emailError.message || "Unknown error"}`;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { email, sent: true, emailDelivered, ...(emailWarning && { emailWarning }) },
      emailDelivered
        ? "OTP code has been sent to your email."
        : "OTP generated but email delivery failed — check server logs."
    )
  );
});

const loginWithOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with email does not exist");
  }

  if (!user.otp || user.otp !== otp.toString().trim()) {
    throw new ApiError(400, "Invalid OTP code");
  }

  if (!user.otpExpire || new Date(user.otpExpire) < new Date()) {
    throw new ApiError(400, "OTP has expired. Please request a new code.");
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire -otp -otpExpire"
  );

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "Logged in successfully via OTP"
      )
    );
});

const resendOtp = asyncHandler(async (req, res) => {
  const { email, purpose = "Verification" } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const otp = generate6DigitOtp();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpire = otpExpire;
  await user.save({ validateBeforeSave: false });

  let emailDelivered = false;
  let emailWarning = null;
  try {
    const emailResult = await sendOtpEmail(email, otp, purpose);
    emailDelivered = emailResult?.delivered === true;
    if (!emailDelivered) {
      emailWarning = emailResult?.reason === "no_smtp_config"
        ? "Email service is not configured. OTP was logged on the server console."
        : `Email delivery failed: ${emailResult?.error || "Unknown error"}. OTP was logged on the server console.`;
    }
  } catch (emailError) {
    console.error("⚠️ OTP email dispatch error:", emailError.message || emailError);
    emailWarning = `Email delivery failed: ${emailError.message || "Unknown error"}`;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { email, resent: true, emailDelivered, ...(emailWarning && { emailWarning }) },
      emailDelivered
        ? "A new OTP has been dispatched to your email."
        : "OTP regenerated but email delivery failed — check server logs."
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire -otp -otpExpire");

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (req.user?._id) {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          refreshToken: 1,
        },
      },
      {
        new: true,
      }
    );
  }

  return res
    .status(200)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User with email does not exist");
  }

  const resetToken = crypto.randomBytes(20).toString("hex");

  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  const message = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Please click on the link below to reset your password:</p>
    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    <p>If you did not request this, please ignore this email.</p>
  `;

  const emailResult = await sendEmail({
    to: user.email,
    subject: "LifeSync Password Reset",
    html: message,
  });

  const emailDelivered = emailResult?.delivered === true;

  if (!emailDelivered) {
    const reason = emailResult?.reason === "no_smtp_config"
      ? "Email service is not configured. Reset link was logged on the server console."
      : `Email delivery failed: ${emailResult?.error || "Unknown error"}`;
    return res.status(200).json(
      new ApiResponse(200, { emailDelivered, emailWarning: reason }, "Password reset generated but email delivery failed — check server logs.")
    );
  }

  return res.status(200).json(new ApiResponse(200, { emailDelivered: true }, "Reset token dispatched to email"));
});

const resetPassword = asyncHandler(async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid reset token or token expired");
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password reset successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile retrieved successfully"));
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, avatar, phoneNumber, whatsappOptIn, whatsappVerified, whatsappPreferences } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
  if (whatsappOptIn !== undefined) user.whatsappOptIn = whatsappOptIn;
  if (whatsappVerified !== undefined) user.whatsappVerified = whatsappVerified;
  if (whatsappPreferences !== undefined) {
    user.whatsappPreferences = {
      ...(user.whatsappPreferences || { tasks: true, goals: true, events: true, memberships: true }),
      ...whatsappPreferences,
    };
  }

  await user.save({ validateBeforeSave: false });

  const updatedUser = await User.findById(user._id).select("-password -refreshToken -verificationToken -resetPasswordToken -resetPasswordExpire -otp -otpExpire");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

export {
  registerUser,
  verifyOtp,
  sendOtp,
  loginWithOtp,
  resendOtp,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
};

