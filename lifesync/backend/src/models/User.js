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
    const userId = this.id || this._id;
    return jwt.sign(
      {
        id: userId,
        _id: userId,
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
    const userId = this.id || this._id;
    return jwt.sign(
      {
        id: userId,
        _id: userId,
      },
      process.env.JWT_REFRESH_SECRET || "lifesync_refresh_secret_key_983749837492",
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d",
      }
    );
  }

  async save() {
    const docId = this._id || this.id;
    if (!docId) return this;
    return await User.findByIdAndUpdate(docId, this, { new: true });
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

  async findByIdAndUpdate(id, update = {}, options = {}) {
    if (update.password && !update.password.startsWith("$2")) {
      update.password = await bcryptjs.hash(update.password, 10);
    }
    return await super.findByIdAndUpdate(id, update, options);
  }

  async findOneAndUpdate(query = {}, update = {}, options = {}) {
    if (update.password && !update.password.startsWith("$2")) {
      update.password = await bcryptjs.hash(update.password, 10);
    }
    return await super.findOneAndUpdate(query, update, options);
  }
}

export const User = new UserModel();
