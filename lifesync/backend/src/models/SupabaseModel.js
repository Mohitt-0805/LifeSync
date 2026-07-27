import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { store, MockModelBase, MockDoc } from "../utils/mockDb.js";

// Helper: convert camelCase object keys to snake_case for PostgreSQL
export const toSnakeCase = (obj) => {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  const snakeObj = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) continue; // Skip MongoDB operator keys if passed
    let snakeKey;
    if (key === "_id") {
      snakeKey = "id";
    } else {
      snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    }
    snakeObj[snakeKey] = obj[key];
  }
  return snakeObj;
};

// Helper: convert snake_case database row keys to camelCase for JS API
export const toCamelCase = (row) => {
  if (!row || typeof row !== "object") return row;
  if (Array.isArray(row)) return row.map(toCamelCase);

  const camelObj = {};
  for (const key of Object.keys(row)) {
    let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    // Preserve _id alias for MongoDB frontend/controller compatibility
    if (key === "id") {
      camelObj._id = row[key];
      camelObj.id = row[key];
    } else {
      camelObj[camelKey] = row[key];
    }
  }
  return camelObj;
};

// Chainable query result class mimicking Mongoose Query interface (.select(), .sort(), .limit(), .skip())
class SupabaseQueryBuilder {
  constructor(modelInstance, queryPromise) {
    this.modelInstance = modelInstance;
    this.queryPromise = queryPromise;
    this._selectFields = null;
  }

  select(fieldsStr) {
    this._selectFields = fieldsStr;
    return this;
  }

  sort(sortObj) {
    return this;
  }

  skip(n) {
    return this;
  }

  limit(n) {
    return this;
  }

  async then(resolve, reject) {
    try {
      const res = await this.queryPromise;
      let data = res;
      if (Array.isArray(data)) {
        data = data.map((item) => this.modelInstance.attachDocMethods(item));
        if (this._selectFields) {
          data = data.map((item) => this.modelInstance.applySelect(item, this._selectFields));
        }
      } else if (data && typeof data === "object") {
        data = this.modelInstance.attachDocMethods(data);
        if (this._selectFields) {
          data = this.modelInstance.applySelect(data, this._selectFields);
        }
      }
      return resolve(data);
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }
}

export class SupabaseModel {
  constructor(tableName, storeKey, DocClass = MockDoc) {
    this.tableName = tableName;
    this.storeKey = storeKey;
    this.DocClass = DocClass || MockDoc;
    this.mockFallback = new MockModelBase(storeKey, this.DocClass);
  }

  get isSupabaseActive() {
    return process.env.USE_MOCK_DB !== "true" && Boolean(supabase);
  }

  attachDocMethods(doc) {
    if (!doc) return null;
    const formatted = toCamelCase(doc);
    let instance = formatted;
    if (this.DocClass && typeof this.DocClass === "function") {
      try {
        instance = new this.DocClass(formatted);
        Object.assign(instance, formatted);
      } catch (e) {
        instance = formatted;
      }
    }
    // Add generic save method to instance so document.save() updates Supabase
    instance.save = async () => {
      const docId = instance._id || instance.id;
      return await this.findByIdAndUpdate(docId, instance, { new: true });
    };
    return instance;
  }

  applySelect(doc, fieldsStr) {
    if (!doc || !fieldsStr) return doc;
    const obj = { ...doc };
    const parts = fieldsStr.trim().split(/\s+/);
    const exclusions = parts.filter((p) => p.startsWith("-")).map((p) => p.slice(1));
    const inclusions = parts.filter((p) => !p.startsWith("-"));

    if (exclusions.length > 0) {
      exclusions.forEach((f) => {
        delete obj[f];
      });
    } else if (inclusions.length > 0) {
      const allowed = new Set(inclusions.concat(["_id", "id"]));
      Object.keys(obj).forEach((k) => {
        if (!allowed.has(k)) delete obj[k];
      });
    }
    return obj;
  }

  find(query = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.find(query);
    }

    const exec = async () => {
      let builder = supabase.from(this.tableName).select("*");
      const snakeQuery = toSnakeCase(query);

      for (const [key, val] of Object.entries(snakeQuery)) {
        if (val === undefined || val === null) continue;
        if (typeof val === "object" && !Array.isArray(val)) {
          if (val.$gte !== undefined) builder = builder.gte(key, val.$gte);
          if (val.$lte !== undefined) builder = builder.lte(key, val.$lte);
          if (val.$gt !== undefined) builder = builder.gt(key, val.$gt);
          if (val.$lt !== undefined) builder = builder.lt(key, val.$lt);
          if (val.$ne !== undefined) builder = builder.neq(key, val.$ne);
        } else {
          builder = builder.eq(key, val);
        }
      }

      const { data, error } = await builder;
      if (error) {
        console.error(`Supabase find error on ${this.tableName}:`, error.message);
        throw new Error(error.message);
      }
      return data || [];
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  findOne(query = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.findOne(query);
    }

    const exec = async () => {
      let builder = supabase.from(this.tableName).select("*");
      const snakeQuery = toSnakeCase(query);

      for (const [key, val] of Object.entries(snakeQuery)) {
        if (val === undefined || val === null) continue;
        if (typeof val === "object" && !Array.isArray(val)) {
          if (val.$gte !== undefined) builder = builder.gte(key, val.$gte);
          if (val.$lte !== undefined) builder = builder.lte(key, val.$lte);
          if (val.$gt !== undefined) builder = builder.gt(key, val.$gt);
          if (val.$lt !== undefined) builder = builder.lt(key, val.$lt);
          if (val.$ne !== undefined) builder = builder.neq(key, val.$ne);
        } else {
          builder = builder.eq(key, val);
        }
      }

      const { data, error } = await builder.limit(1).maybeSingle();
      if (error && error.code !== "PGRST116") {
        console.error(`Supabase findOne error on ${this.tableName}:`, error.message);
        throw new Error(error.message);
      }
      return data || null;
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  findById(id) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.findById(id);
    }

    const exec = async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .eq("id", id.toString())
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error(`Supabase findById error on ${this.tableName}:`, error.message);
        throw new Error(error.message);
      }
      return data || null;
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  async create(data) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.create(data);
    }

    const snakeData = toSnakeCase(data);
    if (!snakeData.created_at) snakeData.created_at = new Date().toISOString();
    if (!snakeData.updated_at) snakeData.updated_at = new Date().toISOString();

    const { data: created, error } = await supabase
      .from(this.tableName)
      .insert([snakeData])
      .select()
      .single();

    if (error) {
      console.error(`Supabase create error on ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }

    return this.attachDocMethods(created);
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    return this.findOneAndUpdate({ id: id?.toString() }, update, options);
  }

  async findOneAndUpdate(query = {}, update = {}, options = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.findOneAndUpdate(query, update, options);
    }

    const snakeQuery = toSnakeCase(query);
    let snakeUpdate = {};

    if (update.$unset) {
      Object.keys(update.$unset).forEach((k) => {
        const snakeK = k.replace(/([A-Z])/g, "_$1").toLowerCase();
        snakeUpdate[snakeK] = null;
      });
    }

    const plainUpdate = Object.fromEntries(
      Object.entries(update).filter(([k]) => !k.startsWith("$"))
    );
    Object.assign(snakeUpdate, toSnakeCase(plainUpdate));
    snakeUpdate.updated_at = new Date().toISOString();

    let builder = supabase.from(this.tableName).update(snakeUpdate);

    for (const [key, val] of Object.entries(snakeQuery)) {
      if (val !== undefined && val !== null) {
        builder = builder.eq(key, val);
      }
    }

    const { data, error } = await builder.select().limit(1).maybeSingle();

    if (error) {
      console.error(`Supabase findOneAndUpdate error on ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }

    return data ? this.attachDocMethods(data) : null;
  }

  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ id: id?.toString() });
  }

  async findOneAndDelete(query = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.findOneAndDelete(query);
    }

    const snakeQuery = toSnakeCase(query);
    let builder = supabase.from(this.tableName).delete();

    for (const [key, val] of Object.entries(snakeQuery)) {
      if (val !== undefined && val !== null) {
        builder = builder.eq(key, val);
      }
    }

    const { data, error } = await builder.select().limit(1).maybeSingle();

    if (error) {
      console.error(`Supabase findOneAndDelete error on ${this.tableName}:`, error.message);
      throw new Error(error.message);
    }

    return data ? this.attachDocMethods(data) : null;
  }

  async countDocuments(query = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.countDocuments(query);
    }

    let builder = supabase.from(this.tableName).select("id", { count: "exact", head: true });
    const snakeQuery = toSnakeCase(query);

    for (const [key, val] of Object.entries(snakeQuery)) {
      if (val !== undefined && val !== null) {
        builder = builder.eq(key, val);
      }
    }

    const { count, error } = await builder;
    if (error) {
      console.error(`Supabase countDocuments error on ${this.tableName}:`, error.message);
      return 0;
    }
    return count || 0;
  }

  async deleteMany(query = {}) {
    if (!this.isSupabaseActive) {
      return this.mockFallback.deleteMany(query);
    }

    let builder = supabase.from(this.tableName).delete();
    const snakeQuery = toSnakeCase(query);

    for (const [key, val] of Object.entries(snakeQuery)) {
      if (val !== undefined && val !== null) {
        builder = builder.eq(key, val);
      }
    }

    const { data, error } = await builder.select();
    if (error) {
      console.error(`Supabase deleteMany error on ${this.tableName}:`, error.message);
      return { deletedCount: 0 };
    }
    return { deletedCount: data ? data.length : 0 };
  }
}
