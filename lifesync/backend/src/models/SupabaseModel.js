import crypto from "crypto";
import { supabase } from "../config/supabase.js";
import { store, MockModelBase, MockDoc } from "../utils/mockDb.js";

// Helper: serialize query values (specifically Javascript Date objects to ISO strings)
const serializeQueryVal = (val) => {
  if (val instanceof Date) {
    return val.toISOString();
  }
  return val;
};

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
    } else if (key === "user") {
      snakeKey = "user_id";
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
    if (key.startsWith("_") && key !== "_id") {
      camelObj[key] = row[key];
      continue;
    }

    let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    // Preserve _id alias for MongoDB frontend/controller compatibility
    if (key === "id" || key === "_id") {
      camelObj._id = row[key];
      camelObj.id = row[key];
    } else if (key === "user_id") {
      camelObj.user = row[key];
      camelObj.userId = row[key];
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

  /**
   * Resilient execution helper:
   * Tries to execute the Supabase query with a 5-second timeout.
   * If it fails or times out, it logs a warning and falls back to the in-memory Mock DB.
   */
  async runQuery(supabaseFn, mockFn, label = "query") {
    if (!this.isSupabaseActive) {
      return await mockFn();
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Database query timeout (${label})`)), 5000)
      );
      return await Promise.race([supabaseFn(), timeoutPromise]);
    } catch (err) {
      console.warn(`⚠️ Supabase ${label} error on ${this.tableName}: ${err.message || err}. Falling back to in-memory Mock DB.`);
      return await mockFn();
    }
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
    const exec = async () => {
      return await this.runQuery(
        async () => {
          let builder = supabase.from(this.tableName).select("*");
          const snakeQuery = toSnakeCase(query);

          for (const [key, val] of Object.entries(snakeQuery)) {
            if (val === undefined || val === null) continue;
            if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
              if (val.$gte !== undefined) builder = builder.gte(key, serializeQueryVal(val.$gte));
              if (val.$lte !== undefined) builder = builder.lte(key, serializeQueryVal(val.$lte));
              if (val.$gt !== undefined) builder = builder.gt(key, serializeQueryVal(val.$gt));
              if (val.$lt !== undefined) builder = builder.lt(key, serializeQueryVal(val.$lt));
              if (val.$ne !== undefined) builder = builder.neq(key, serializeQueryVal(val.$ne));
            } else {
              builder = builder.eq(key, serializeQueryVal(val));
            }
          }

          const { data, error } = await builder;
          if (error) throw error;
          return data || [];
        },
        async () => {
          return await this.mockFallback.find(query);
        },
        "find"
      );
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  findOne(query = {}) {
    const exec = async () => {
      return await this.runQuery(
        async () => {
          let builder = supabase.from(this.tableName).select("*");
          const snakeQuery = toSnakeCase(query);

          for (const [key, val] of Object.entries(snakeQuery)) {
            if (val === undefined || val === null) continue;
            if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
              if (val.$gte !== undefined) builder = builder.gte(key, serializeQueryVal(val.$gte));
              if (val.$lte !== undefined) builder = builder.lte(key, serializeQueryVal(val.$lte));
              if (val.$gt !== undefined) builder = builder.gt(key, serializeQueryVal(val.$gt));
              if (val.$lt !== undefined) builder = builder.lt(key, serializeQueryVal(val.$lt));
              if (val.$ne !== undefined) builder = builder.neq(key, serializeQueryVal(val.$ne));
            } else {
              builder = builder.eq(key, serializeQueryVal(val));
            }
          }

          const { data, error } = await builder.limit(1).maybeSingle();
          if (error && error.code !== "PGRST116") throw error;
          return data || null;
        },
        async () => {
          return await this.mockFallback.findOne(query);
        },
        "findOne"
      );
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  findById(id) {
    const exec = async () => {
      return await this.runQuery(
        async () => {
          if (!id) return null;
          const { data, error } = await supabase
            .from(this.tableName)
            .select("*")
            .eq("id", id.toString())
            .limit(1)
            .maybeSingle();

          if (error && error.code !== "PGRST116") throw error;
          return data || null;
        },
        async () => {
          return await this.mockFallback.findById(id);
        },
        "findById"
      );
    };

    return new SupabaseQueryBuilder(this, exec());
  }

  async create(data) {
    return await this.runQuery(
      async () => {
        const snakeData = toSnakeCase(data);
        if (!snakeData.created_at) snakeData.created_at = new Date().toISOString();
        if (!snakeData.updated_at) snakeData.updated_at = new Date().toISOString();

        const { data: created, error } = await supabase
          .from(this.tableName)
          .insert([snakeData])
          .select()
          .single();

        if (error) throw error;
        return this.attachDocMethods(created);
      },
      async () => {
        return await this.mockFallback.create(data);
      },
      "create"
    );
  }

  async findByIdAndUpdate(id, update = {}, options = {}) {
    return this.findOneAndUpdate({ id: id?.toString() }, update, options);
  }

  async findOneAndUpdate(query = {}, update = {}, options = {}) {
    return await this.runQuery(
      async () => {
        const snakeQuery = toSnakeCase(query);
        
        // Check if row already exists
        let findBuilder = supabase.from(this.tableName).select("*");
        for (const [key, val] of Object.entries(snakeQuery)) {
          if (val !== undefined && val !== null) {
            findBuilder = findBuilder.eq(key, serializeQueryVal(val));
          }
        }
        const { data: existing, error: findError } = await findBuilder.limit(1).maybeSingle();
        if (findError && findError.code !== "PGRST116") throw findError;

        if (!existing && !options.upsert) {
          return null;
        }

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

        if (existing) {
          // Perform update
          snakeUpdate.updated_at = new Date().toISOString();
          let builder = supabase.from(this.tableName).update(snakeUpdate);
          for (const [key, val] of Object.entries(snakeQuery)) {
            if (val !== undefined && val !== null) {
              builder = builder.eq(key, serializeQueryVal(val));
            }
          }
          const { data, error } = await builder.select().limit(1).maybeSingle();
          if (error) throw error;
          return data ? this.attachDocMethods(data) : null;
        } else {
          // Perform insert (upsert)
          const insertData = { ...snakeQuery, ...snakeUpdate };
          if (!insertData.created_at) insertData.created_at = new Date().toISOString();
          if (!insertData.updated_at) insertData.updated_at = new Date().toISOString();

          const { data, error } = await supabase
            .from(this.tableName)
            .insert([insertData])
            .select()
            .single();
          if (error) throw error;
          return this.attachDocMethods(data);
        }
      },
      async () => {
        return await this.mockFallback.findOneAndUpdate(query, update, options);
      },
      "findOneAndUpdate"
    );
  }

  async findByIdAndDelete(id) {
    return this.findOneAndDelete({ id: id?.toString() });
  }

  async findOneAndDelete(query = {}) {
    return await this.runQuery(
      async () => {
        const snakeQuery = toSnakeCase(query);
        let builder = supabase.from(this.tableName).delete();

        for (const [key, val] of Object.entries(snakeQuery)) {
          if (val !== undefined && val !== null) {
            builder = builder.eq(key, serializeQueryVal(val));
          }
        }

        const { data, error } = await builder.select().limit(1).maybeSingle();

        if (error) throw error;
        return data ? this.attachDocMethods(data) : null;
      },
      async () => {
        return await this.mockFallback.findOneAndDelete(query);
      },
      "findOneAndDelete"
    );
  }

  async countDocuments(query = {}) {
    return await this.runQuery(
      async () => {
        let builder = supabase.from(this.tableName).select("id", { count: "exact", head: true });
        const snakeQuery = toSnakeCase(query);

        for (const [key, val] of Object.entries(snakeQuery)) {
          if (val !== undefined && val !== null) {
            builder = builder.eq(key, serializeQueryVal(val));
          }
        }

        const { count, error } = await builder;
        if (error) throw error;
        return count || 0;
      },
      async () => {
        return await this.mockFallback.countDocuments(query);
      },
      "countDocuments"
    );
  }

  async deleteMany(query = {}) {
    return await this.runQuery(
      async () => {
        let builder = supabase.from(this.tableName).delete();
        const snakeQuery = toSnakeCase(query);

        for (const [key, val] of Object.entries(snakeQuery)) {
          if (val !== undefined && val !== null) {
            builder = builder.eq(key, serializeQueryVal(val));
          }
        }

        const { data, error } = await builder.select();
        if (error) throw error;
        return { deletedCount: data ? data.length : 0 };
      },
      async () => {
        return await this.mockFallback.deleteMany(query);
      },
      "deleteMany"
    );
  }

  async distinct(field, query = {}) {
    const results = await this.find(query);
    const values = results.map((item) => item[field]);
    return [...new Set(values.filter((v) => v !== undefined && v !== null))];
  }
}
