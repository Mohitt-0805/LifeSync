import mongoose, { Schema } from "mongoose";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
    },
    googleId: {
      type: String,
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    xp: {
      type: Number,
      default: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    refreshToken: {
      type: String,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    otp: {
      type: String,
    },
    otpExpire: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    phoneNumber: {
      type: String,
      default: "",
    },
    whatsappOptIn: {
      type: Boolean,
      default: false,
    },
    whatsappVerified: {
      type: Boolean,
      default: false,
    },
    whatsappPreferences: {
      tasks: { type: Boolean, default: true },
      goals: { type: Boolean, default: true },
      events: { type: Boolean, default: true },
      memberships: { type: Boolean, default: true },
    },
    currency: {
      type: String,
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcryptjs.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) return false;
  return await bcryptjs.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
      role: this.role,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
    }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
    }
  );
};

import { MockUser } from "../utils/mockDb.js";
export const User = process.env.USE_MOCK_DB === "true" ? MockUser : mongoose.model("User", userSchema);
