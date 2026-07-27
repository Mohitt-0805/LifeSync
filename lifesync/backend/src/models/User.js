import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { SupabaseModel } from "./SupabaseModel.js";

export class UserDoc {
  constructor(fields = {}) {
    Object.assign(this, fields);
    this._id = fields._id || fields.id;
    this.xp = fields.xp ?? 0;
    this.level = fields.level ?? 1;
    this.role = fields.role || "user";
    this.isVerified = fields.isVerified ?? false;
    this.avatar = fields.avatar || "";
    this.phoneNumber = fields.phoneNumber || "";
    this.whatsappOptIn = fields.whatsappOptIn ?? false;
    this.whatsappVerified = fields.whatsappVerified ?? false;
    this.whatsappPreferences = fields.whatsappPreferences || {
      tasks: true,
      goals: true,
      events: true,
      memberships: true,
    };
    this.currency = fields.currency || "INR";
  }

  async isPasswordCorrect(password) {
    if (!this.password) return false;
    if (this.password.startsWith("$2")) {
      return await bcryptjs.compare(password, this.password);
    }
    return this.password === password;
  }

  generateAccessToken() {
    return jwt.sign(
      {
        _id: this._id || this.id,
        email: this.email,
        name: this.name,
        role: this.role,
      },
      process.env.JWT_ACCESS_SECRET || "lifesync_access_secret_key_384729384729",
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m",
      }
    );
  }

  generateRefreshToken() {
    return jwt.sign(
      {
        _id: this._id || this.id,
      },
      process.env.JWT_REFRESH_SECRET || "lifesync_refresh_secret_key_983749837492",
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
      }
    );
  }
}

class UserModel extends SupabaseModel {
  constructor() {
    super("users", "users", UserDoc);
  }

  async create(data) {
    if (data.password && !data.password.startsWith("$2")) {
      data.password = await bcryptjs.hash(data.password, 10);
    }
    return await super.create(data);
  }
}

export const User = new UserModel();
