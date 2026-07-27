import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";

// ─── Global in-memory store ───────────────────────────────────────────────────
export const store = {
  users: [],
  tasks: [],
  goals: [],
  habits: [],
  habitlogs: [],
  expenses: [],
  budgets: [],
  notes: [],
  events: [],
  notifications: [],
  activities: [],
  achievements: [],
  courses: [],
  lessons: [],
  userlessonprogress: [],
  messagelogs: [],
  classschedules: [],
  focussessions: [],
};

// ─── Helper: 24-char hex ObjectId ────────────────────────────────────────────
const newId = () => crypto.randomBytes(12).toString("hex");

// ─── Helper: strip excluded fields (Mongoose .select("-field") syntax) ────────
const applySelect = (doc, fieldsStr) => {
  if (!fieldsStr || !doc) return doc;
  const obj = { ...doc };
  // Remove internal mock key always
  delete obj._storeKey;

  const parts = fieldsStr.trim().split(/\s+/);
  const exclusions = parts.filter((p) => p.startsWith("-")).map((p) => p.slice(1));
  const inclusions = parts.filter((p) => !p.startsWith("-"));

  if (exclusions.length > 0) {
    exclusions.forEach((field) => delete obj[field]);
  } else if (inclusions.length > 0) {
    const allowed = new Set(inclusions.concat(["_id"]));
    Object.keys(obj).forEach((k) => { if (!allowed.has(k)) delete obj[k]; });
  }
  return obj;
};

// ─── MockDoc base class ───────────────────────────────────────────────────────
class MockDoc {
  constructor(fields, storeKey) {
    Object.assign(this, fields);
    // Allow _storeKey to come from the fields (stored docs) or explicit param
    if (storeKey) this._storeKey = storeKey;
    // If _storeKey is still missing, we can't recover — this should not happen
    if (!this._id) this._id = crypto.randomBytes(12).toString("hex");
    if (!this.createdAt) this.createdAt = new Date();
    if (!this.updatedAt) this.updatedAt = new Date();
  }

  async save() {
    const collection = store[this._storeKey];
    const idx = collection.findIndex((item) => item._id === this._id);
    this.updatedAt = new Date();
    if (idx !== -1) {
      Object.assign(collection[idx], this);
      return collection[idx];
    } else {
      collection.push(this);
      return this;
    }
  }

  toObject() {
    const obj = { ...this };
    delete obj._storeKey;
    return obj;
  }

  toJSON() {
    return this.toObject();
  }
}

// ─── MockUserDoc: User-specific schema defaults + auth methods ─────────────────
class MockUserDoc extends MockDoc {
  constructor(fields) {
    super(fields, "users");
    // Apply schema defaults
    if (this.xp === undefined) this.xp = 0;
    if (this.level === undefined) this.level = 1;
    if (this.role === undefined) this.role = "user";
    if (this.isVerified === undefined) this.isVerified = false;
    if (this.avatar === undefined) this.avatar = "";
    if (this.phoneNumber === undefined) this.phoneNumber = "";
    if (this.whatsappOptIn === undefined) this.whatsappOptIn = false;
    if (this.whatsappVerified === undefined) this.whatsappVerified = false;
    if (this.whatsappPreferences === undefined) {
      this.whatsappPreferences = {
        tasks: true,
        goals: true,
        events: true,
        memberships: true,
      };
    }
    if (this.currency === undefined) this.currency = "INR";
    if (this.otp === undefined) this.otp = null;
    if (this.otpExpire === undefined) this.otpExpire = null;
  }

  async isPasswordCorrect(password) {
    if (!this.password) return false;
    // If stored password looks like a bcrypt hash, compare properly
    if (this.password.startsWith("$2")) {
      return await bcryptjs.compare(password, this.password);
    }
    // Plain text fallback (shouldn't happen after first save)
    return this.password === password;
  }

  generateAccessToken() {
    return jwt.sign(
      { _id: this._id, email: this.email, name: this.name, role: this.role },
      process.env.JWT_ACCESS_SECRET || "mock_access_secret_384729",
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || "15m" }
    );
  }

  generateRefreshToken() {
    return jwt.sign(
      { _id: this._id },
      process.env.JWT_REFRESH_SECRET || "mock_refresh_secret_983749",
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d" }
    );
  }
}

// ─── MockGoalDoc: milestone subdocuments ──────────────────────────────────────
class MockGoalDoc extends MockDoc {
  constructor(fields) {
    super(fields, "goals");
    // Apply schema defaults
    if (this.status === undefined) this.status = "not_started";
    if (this.progress === undefined) this.progress = 0;

    if (this.milestones) {
      this.milestones = this.milestones.map((m) => ({
        _id: m._id || newId(),
        title: m.title || m,
        isCompleted: !!m.isCompleted,
        completedAt: m.completedAt || null,
      }));
    } else {
      this.milestones = [];
    }
    // Attach Mongoose subdoc .id() helper
    this.milestones.id = (id) => this.milestones.find((m) => m._id === id);
  }
}

// ─── MockTaskDoc: task schema defaults ────────────────────────────────────────
class MockTaskDoc extends MockDoc {
  constructor(fields) {
    super(fields, "tasks");
    if (this.status === undefined) this.status = "todo";
    if (this.priority === undefined) this.priority = "medium";
    if (this.tags === undefined) this.tags = [];
  }
}

// ─── MockHabitDoc: habit schema defaults ──────────────────────────────────────
class MockHabitDoc extends MockDoc {
  constructor(fields) {
    super(fields, "habits");
    if (this.streak === undefined) this.streak = 0;
    if (this.bestStreak === undefined) this.bestStreak = 0;
    if (this.isActive === undefined) this.isActive = true;
  }
}

// ─── Query matcher ─────────────────────────────────────────────────────────────
const matchesQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  for (const key in query) {
    const val = query[key];

    if (key === "$or" && Array.isArray(val)) {
      if (!val.some((sub) => matchesQuery(item, sub))) return false;
      continue;
    }

    if (val instanceof RegExp) {
      if (!val.test(String(item[key] || ""))) return false;
      continue;
    }

    if (val && typeof val === "object" && !Array.isArray(val)) {
      const itemVal = item[key];
      const d = key === "startDate" || key === "date" || key === "endDate"
        ? (v) => new Date(v)
        : (v) => v;

      if (val.$gte !== undefined && d(itemVal) < d(val.$gte)) return false;
      if (val.$lte !== undefined && d(itemVal) > d(val.$lte)) return false;
      if (val.$gt !== undefined && d(itemVal) <= d(val.$gt)) return false;
      if (val.$lt !== undefined && d(itemVal) >= d(val.$lt)) return false;
      if (val.$ne !== undefined && itemVal === val.$ne) return false;
      continue;
    }

    if (item[key] !== val) return false;
  }
  return true;
};

// ─── MockQuery (chainable, list-returning) ────────────────────────────────────
class MockQuery {
  constructor(data, storeKey, DocClass) {
    this._data = [...data];
    this._storeKey = storeKey;
    this._DocClass = DocClass;
    this._selectStr = null;
  }

  sort(sortObj) {
    if (!sortObj) return this;
    const entries = Object.entries(sortObj);
    this._data.sort((a, b) => {
      for (const [key, dir] of entries) {
        let va = a[key], vb = b[key];
        if (va instanceof Date) va = va.getTime();
        if (vb instanceof Date) vb = vb.getTime();
        if (va < vb) return dir === 1 ? -1 : 1;
        if (va > vb) return dir === 1 ? 1 : -1;
      }
      return 0;
    });
    return this;
  }

  skip(n) { this._data = this._data.slice(n); return this; }
  limit(n) { this._data = this._data.slice(0, n); return this; }
  select(str) { this._selectStr = str; return this; }

  then(resolve) {
    const results = this._data.map((item) => {
      const doc = item instanceof this._DocClass ? item : new this._DocClass(item);
      if (this._selectStr) return applySelect({ ...doc }, this._selectStr);
      // Always strip internals
      const clean = { ...doc };
      delete clean._storeKey;
      return clean;
    });
    return Promise.resolve(results).then(resolve);
  }
}

// ─── MockSingleQuery (chainable, single-doc returning) ───────────────────────
class MockSingleQuery {
  constructor(doc, DocClass) {
    this._doc = doc;
    this._DocClass = DocClass;
    this._selectStr = null;
  }

  select(str) { this._selectStr = str; return this; }

  then(resolve) {
    if (!this._doc) return Promise.resolve(null).then(resolve);

    // Always return a proper class instance — this ensures:
    // 1. Methods like .save(), .isPasswordCorrect() are available on the prototype
    // 2. Mutations like `user.xp += 10` are tracked on the actual instance
    // 3. _storeKey is stripped by toJSON() when Express serializes the response
    const instance = this._doc instanceof this._DocClass
      ? this._doc
      : new this._DocClass({ ...this._doc });

    if (this._selectStr) {
      // For select queries: strip fields from the instance properties
      // but preserve methods by keeping the prototype chain
      const stripped = applySelect({ ...instance }, this._selectStr);
      // Copy stripped fields back onto the instance (removes excluded fields)
      Object.keys(instance).forEach((k) => {
        if (!(k in stripped) && k !== "_storeKey") delete instance[k];
      });
    }

    return Promise.resolve(instance).then(resolve);
  }
}

// ─── MockModelBase ─────────────────────────────────────────────────────────────
class MockModelBase {
  constructor(storeKey, DocClass = MockDoc) {
    this.storeKey = storeKey;
    this.DocClass = DocClass;
  }

  get collection() { return store[this.storeKey]; }

  find(query = {}) {
    const filtered = this.collection.filter((item) => matchesQuery(item, query));
    return new MockQuery(filtered, this.storeKey, this.DocClass);
  }

  findOne(query = {}) {
    const found = this.collection.find((item) => matchesQuery(item, query));
    return new MockSingleQuery(
      found ? new this.DocClass(found, this.storeKey) : null,
      this.DocClass
    );
  }

  findById(id) {
    const found = this.collection.find((item) => item._id === id?.toString());
    return new MockSingleQuery(
      found ? new this.DocClass(found, this.storeKey) : null,
      this.DocClass
    );
  }

  async create(fields) {
    // Hash password if provided and not already hashed
    if (fields.password && !fields.password.startsWith("$2")) {
      fields = { ...fields, password: await bcryptjs.hash(fields.password, 10) };
    }
    const doc = new this.DocClass(fields, this.storeKey);
    this.collection.push(doc);
    return doc;
  }

  findOneAndDelete(query = {}) {
    const idx = this.collection.findIndex((item) => matchesQuery(item, query));
    if (idx === -1) return Promise.resolve(null);
    const [deleted] = this.collection.splice(idx, 1);
    return Promise.resolve(new this.DocClass(deleted, this.storeKey));
  }

  findOneAndUpdate(query = {}, update = {}, options = {}) {
    let item = this.collection.find((item) => matchesQuery(item, query));
    if (!item && options.upsert) {
      item = new this.DocClass({ ...query });
      this.collection.push(item);
    }
    if (!item) return Promise.resolve(null);

    // Handle $unset operator
    if (update.$unset) {
      Object.keys(update.$unset).forEach((k) => delete item[k]);
    }
    // Merge the rest (non-operator fields)
    const plain = Object.fromEntries(
      Object.entries(update).filter(([k]) => !k.startsWith("$"))
    );
    Object.assign(item, plain);
    item.updatedAt = new Date();
    return Promise.resolve(new this.DocClass(item, this.storeKey));
  }

  findByIdAndUpdate(id, update = {}, options = {}) {
    return this.findOneAndUpdate({ _id: id?.toString() }, update, options);
  }

  countDocuments(query = {}) {
    return Promise.resolve(
      this.collection.filter((item) => matchesQuery(item, query)).length
    );
  }

  distinct(field, query = {}) {
    const filtered = this.collection.filter((item) => matchesQuery(item, query));
    return Promise.resolve([...new Set(filtered.map((item) => item[field]))]);
  }

  deleteMany(query = {}) {
    const before = this.collection.length;
    store[this.storeKey] = this.collection.filter((item) => !matchesQuery(item, query));
    return Promise.resolve({ deletedCount: before - store[this.storeKey].length });
  }
}

// ─── Mock Expense (with aggregate support) ────────────────────────────────────
class MockExpenseModel extends MockModelBase {
  constructor() { super("expenses", MockDoc); }

  aggregate(pipeline = []) {
    const userId = pipeline.find((s) => s.$match)?.["$match"]?.user;
    const allItems = userId
      ? this.collection.filter((e) => e.user === userId?.toString() || e.user === userId)
      : this.collection;

    const expenses = allItems.filter((e) => e.type === "expense");
    const incomes  = allItems.filter((e) => e.type === "income");

    const groupStage = pipeline.find((s) => s.$group)?.$group;
    if (!groupStage) return Promise.resolve([]);

    const idField = groupStage._id;

    // Monthly trend
    if (idField && typeof idField === "object" && idField.year && idField.month) {
      const trend = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const year = d.getFullYear(), month = d.getMonth() + 1;
        const byMonth = (arr) =>
          arr.filter((e) => {
            const dt = new Date(e.date);
            return dt.getFullYear() === year && dt.getMonth() + 1 === month;
          }).reduce((s, e) => s + e.amount, 0);
        const inc = byMonth(incomes);
        const exp = byMonth(expenses);
        if (inc > 0) trend.push({ _id: { year, month, type: "income"  }, total: inc });
        if (exp > 0) trend.push({ _id: { year, month, type: "expense" }, total: exp });
      }
      return Promise.resolve(trend);
    }

    // Category allocation
    if (idField === "$category") {
      const catMap = {};
      expenses.forEach((e) => { catMap[e.category] = (catMap[e.category] || 0) + e.amount; });
      return Promise.resolve(
        Object.keys(catMap).map((cat) =>
          groupStage.spent
            ? { _id: cat, spent: catMap[cat] }
            : { category: cat, total: catMap[cat] }
        )
      );
    }

    // Income vs Expense type totals
    if (idField === "$type") {
      return Promise.resolve([
        { type: "income",  total: incomes.reduce((s, e)  => s + e.amount, 0) },
        { type: "expense", total: expenses.reduce((s, e) => s + e.amount, 0) },
      ]);
    }

    return Promise.resolve([]);
  }
}

export const MockUser                 = new MockModelBase("users", MockUserDoc);
export const MockTask                 = new MockModelBase("tasks", MockTaskDoc);
export const MockGoal                 = new MockModelBase("goals", MockGoalDoc);
export const MockHabit                = new MockModelBase("habits", MockHabitDoc);
export const MockHabitLog             = new MockModelBase("habitlogs", MockDoc);
export const MockBudget               = new MockModelBase("budgets", MockDoc);
export const MockNote                 = new MockModelBase("notes", MockDoc);
export const MockEvent                = new MockModelBase("events", MockDoc);
export const MockNotification         = new MockModelBase("notifications", MockDoc);
export const MockActivity             = new MockModelBase("activities", MockDoc);
export const MockAchievement          = new MockModelBase("achievements", MockDoc);
export const MockExpense              = new MockExpenseModel();
export const MockCourse               = new MockModelBase("courses", MockDoc);
export const MockLesson               = new MockModelBase("lessons", MockDoc);
export const MockUserLessonProgress   = new MockModelBase("userlessonprogress", MockDoc);
export const MockMessageLog           = new MockModelBase("messagelogs", MockDoc);
export const MockClassSchedule        = new MockModelBase("classschedules", MockDoc);
export const MockFocusSession         = new MockModelBase("focussessions", MockDoc);
export const Milestone                = MockDoc;
