"""
FitNovaAI - Database Module
Handles SQLite database initialization, seeding, and query helpers.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "fitnovaai.db")


def get_db():
    """Get a database connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initialize the database schema and seed exercise data."""
    conn = get_db()
    cursor = conn.cursor()

    # ── Schema ──────────────────────────────────────────────
    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            email       TEXT UNIQUE NOT NULL,
            phone       TEXT,
            age         INTEGER,
            gender      TEXT DEFAULT 'other',
            goal        TEXT DEFAULT 'general_fitness',
            fitness_level TEXT DEFAULT 'beginner',
            password_hash TEXT,
            is_verified INTEGER DEFAULT 0,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS otp_codes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT NOT NULL,
            otp_code    TEXT NOT NULL,
            purpose     TEXT NOT NULL DEFAULT 'login',
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at  TIMESTAMP NOT NULL,
            is_used     INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS sessions (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            token       TEXT UNIQUE NOT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at  TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS bmi_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            weight_kg   REAL NOT NULL,
            height_m    REAL NOT NULL,
            bmi_value   REAL NOT NULL,
            category    TEXT NOT NULL,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS exercises (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            name            TEXT NOT NULL,
            muscle_group    TEXT NOT NULL,
            difficulty      TEXT NOT NULL CHECK(difficulty IN ('beginner','intermediate','advanced')),
            goal_tag        TEXT NOT NULL,
            sets            INTEGER DEFAULT 3,
            reps            TEXT DEFAULT '10-12',
            rest_seconds    INTEGER DEFAULT 60,
            instructions    TEXT,
            image_url       TEXT,
            calories_per_set REAL DEFAULT 0,
            is_low_impact   INTEGER DEFAULT 0,
            exercise_type   TEXT DEFAULT 'strength'
        );

        CREATE TABLE IF NOT EXISTS workout_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER NOT NULL,
            workout_json TEXT NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # ── Migrate: add new columns if missing ─────────────────
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(users)").fetchall()}
    if "password_hash" not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "phone" not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
    if "is_verified" not in existing_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0")

    # ── Seed exercises (drop and re-seed for updates) ───────
    cursor.execute("DELETE FROM exercises")

    exercises = [
        # ══════════════════════════════════════════════════════
        # WEIGHT LOSS — mix of HIIT cardio + bodyweight strength
        # ══════════════════════════════════════════════════════

        # Beginner weight loss
        ("Jumping Jacks",         "full_body",  "beginner",     "weight_loss", 3, "30 sec",  30,
         "Stand upright, jump while spreading legs and raising arms overhead, then return to standing.",
         "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", 8, 0, "cardio"),

        ("High Knees",            "legs",       "beginner",     "weight_loss", 3, "30 sec",  30,
         "Run in place, lifting knees to hip height with each step. Pump arms for momentum.",
         "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400", 9, 0, "cardio"),

        ("Jump Rope",             "full_body",  "beginner",     "weight_loss", 4, "1 min",   30,
         "Swing rope over head and jump with both feet, land softly on the balls of your feet.",
         "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400", 11, 0, "cardio"),

        ("Bodyweight Squats",     "legs",       "beginner",     "weight_loss", 3, "15-20",   45,
         "Stand feet shoulder-width, lower hips back and down until thighs are parallel, return to standing.",
         "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400", 5, 1, "strength"),

        ("Push-Ups",              "chest",      "beginner",     "weight_loss", 3, "10-15",   45,
         "Hands shoulder-width on floor, lower chest to ground keeping core tight, push back up.",
         "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", 5, 1, "strength"),

        ("Walking Lunges",        "legs",       "beginner",     "weight_loss", 3, "12 each", 45,
         "Step forward into a lunge, lower back knee toward the floor, then step the rear foot forward into the next lunge.",
         "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400", 6, 1, "strength"),

        ("Plank Hold",            "core",       "beginner",     "weight_loss", 3, "30-45 sec", 30,
         "Hold push-up position on forearms, keep body in a straight line from head to heels.",
         "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400", 3, 1, "strength"),

        ("Brisk Walking",         "cardio",     "beginner",     "weight_loss", 1, "20-30 min", 0,
         "Walk at a pace where you can talk but not sing. Maintain upright posture and swing arms naturally.",
         "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400", 8, 1, "cardio"),

        # Intermediate weight loss
        ("Burpees",               "full_body",  "intermediate", "weight_loss", 4, "10-12",   45,
         "From standing, drop to a squat, kick feet back to plank, perform a push-up, jump feet in, explode upward.",
         "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400", 12, 0, "cardio"),

        ("Mountain Climbers",     "core",       "intermediate", "weight_loss", 3, "20 each", 30,
         "In plank position, alternate driving knees toward chest as fast as possible while keeping hips level.",
         "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", 10, 0, "cardio"),

        ("Kettlebell Swings",     "full_body",  "intermediate", "weight_loss", 4, "15",      45,
         "Hinge at hips, swing kettlebell between legs, then drive hips forward to swing weight to chest height.",
         "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", 9, 0, "strength"),

        ("Dumbbell Thrusters",    "full_body",  "intermediate", "weight_loss", 3, "12",      60,
         "Hold dumbbells at shoulders, squat down, then stand and press dumbbells overhead in one fluid motion.",
         "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400", 8, 0, "strength"),

        ("Battle Ropes",          "arms",       "intermediate", "weight_loss", 3, "30 sec",  30,
         "Hold rope ends, alternate slamming arms up and down creating waves. Keep core engaged throughout.",
         "https://images.unsplash.com/photo-1534368786749-b63e05c90863?w=400", 10, 0, "cardio"),

        ("Jump Squats",           "legs",       "intermediate", "weight_loss", 3, "12-15",   45,
         "Perform a squat, then explosively jump upward. Land softly with knees slightly bent.",
         "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400", 9, 0, "strength"),

        # Advanced weight loss
        ("Box Jumps",             "legs",       "advanced",     "weight_loss", 3, "8-10",    60,
         "Stand before a sturdy box, squat slightly and explode upward onto the box. Step down carefully.",
         "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400", 10, 0, "strength"),

        ("Sprint Intervals",      "cardio",     "advanced",     "weight_loss", 6, "30 sec sprint / 30 sec rest", 30,
         "Sprint at max effort for 30 seconds, walk/jog for 30 seconds. Repeat for all sets.",
         "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400", 14, 0, "cardio"),

        ("Tuck Jumps",            "legs",       "advanced",     "weight_loss", 3, "10",      45,
         "Jump explosively, tucking knees to chest at the peak. Land softly on balls of feet.",
         "https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=400", 11, 0, "cardio"),

        # ══════════════════════════════════════════════════════
        # MUSCLE GAIN — compound lifts + isolation exercises
        # ══════════════════════════════════════════════════════

        # Beginner muscle gain
        ("Dumbbell Bench Press",  "chest",      "beginner",     "muscle_gain", 3, "10-12",   90,
         "Lie on flat bench holding dumbbells above chest, lower to sides of chest, press back up.",
         "https://images.unsplash.com/photo-1534368786749-b63e05c90863?w=400", 6, 1, "strength"),

        ("Dumbbell Rows",         "back",       "beginner",     "muscle_gain", 3, "10-12",   60,
         "Place one knee and hand on bench, pull dumbbell from floor to hip, squeeze shoulder blade at top.",
         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400", 5, 1, "strength"),

        ("Dumbbell Curl",         "arms",       "beginner",     "muscle_gain", 3, "10-12",   60,
         "Stand holding dumbbells at sides, curl weights toward shoulders while keeping elbows stationary.",
         "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400", 4, 1, "strength"),

        ("Goblet Squat",          "legs",       "beginner",     "muscle_gain", 3, "12-15",   60,
         "Hold dumbbell at chest, squat down keeping elbows inside knees, drive through heels to stand.",
         "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400", 6, 1, "strength"),

        ("Dumbbell Shoulder Press","shoulders", "beginner",     "muscle_gain", 3, "10-12",   60,
         "Seated or standing, press dumbbells from shoulder height to overhead, lower under control.",
         "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400", 5, 1, "strength"),

        ("Lat Pulldown",          "back",       "beginner",     "muscle_gain", 3, "10-12",   60,
         "Grip the bar wide, pull it down to upper chest while squeezing shoulder blades together.",
         "https://images.unsplash.com/photo-1598971639058-a05b1700c72e?w=400", 5, 1, "strength"),

        ("Leg Press",             "legs",       "beginner",     "muscle_gain", 3, "12-15",   90,
         "Sit in leg press machine, place feet shoulder-width on platform, press up and lower under control.",
         "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400", 7, 1, "strength"),

        ("Tricep Pushdown",       "arms",       "beginner",     "muscle_gain", 3, "12-15",   45,
         "At cable machine, grip bar with palms down, push bar down until arms are straight, control the return.",
         "https://images.unsplash.com/photo-1597452485677-d661670d9640?w=400", 3, 1, "strength"),

        # Intermediate muscle gain
        ("Bench Press",           "chest",      "intermediate", "muscle_gain", 4, "8-10",    90,
         "Lie on bench, grip barbell shoulder-width, lower bar to mid-chest, press up explosively.",
         "https://images.unsplash.com/photo-1534368786749-b63e05c90863?w=400", 7, 0, "strength"),

        ("Barbell Squat",         "legs",       "intermediate", "muscle_gain", 4, "8-10",    120,
         "Bar on upper back, feet shoulder-width, squat until thighs are parallel to floor, drive up through heels.",
         "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400", 8, 0, "strength"),

        ("Overhead Press",        "shoulders",  "intermediate", "muscle_gain", 3, "8-10",    90,
         "Press barbell from front shoulders to overhead, fully extending arms. Lower under control.",
         "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400", 6, 0, "strength"),

        ("Barbell Row",           "back",       "intermediate", "muscle_gain", 4, "8-10",    90,
         "Hinge forward at hips, pull barbell from hanging position to lower chest, squeeze back muscles.",
         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400", 7, 0, "strength"),

        ("Tricep Dips",           "arms",       "intermediate", "muscle_gain", 3, "10-12",   60,
         "Grip parallel bars, lower body by bending elbows to 90 degrees, press back up to full lockout.",
         "https://images.unsplash.com/photo-1597452485677-d661670d9640?w=400", 5, 0, "strength"),

        ("Incline Dumbbell Press","chest",      "intermediate", "muscle_gain", 3, "10-12",   90,
         "On incline bench, press dumbbells up from chest level. Targets upper chest specifically.",
         "https://images.unsplash.com/photo-1534368786749-b63e05c90863?w=400", 6, 0, "strength"),

        ("Romanian Deadlift",     "legs",       "intermediate", "muscle_gain", 3, "10-12",   90,
         "Hold barbell, hinge at hips pushing them back, lower bar along legs until hamstring stretch, return to standing.",
         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400", 7, 0, "strength"),

        ("Lateral Raises",        "shoulders",  "intermediate", "muscle_gain", 3, "12-15",   45,
         "Hold dumbbells at sides, raise arms out to the sides until parallel with floor, lower slowly.",
         "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?w=400", 3, 0, "strength"),

        # Advanced muscle gain
        ("Deadlift",              "back",       "advanced",     "muscle_gain", 4, "5-6",     150,
         "Stand over barbell, hinge at hips, grip bar, brace core, drive through heels to stand. The king of lifts.",
         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400", 10, 0, "strength"),

        ("Pull-Ups",              "back",       "advanced",     "muscle_gain", 4, "6-8",     90,
         "Hang from bar with overhand grip, pull chin above bar by driving elbows down, lower controlled.",
         "https://images.unsplash.com/photo-1598971639058-a05b1700c72e?w=400", 7, 0, "strength"),

        ("Weighted Dips",         "chest",      "advanced",     "muscle_gain", 4, "8-10",    90,
         "Attach weight belt, lean forward on parallel bars, lower until upper arms are parallel.",
         "https://images.unsplash.com/photo-1597452485677-d661670d9640?w=400", 8, 0, "strength"),

        ("Front Squat",           "legs",       "advanced",     "muscle_gain", 4, "6-8",     120,
         "Bar rests on front delts, elbows high. Squat deep with upright torso. Emphasizes quads.",
         "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400", 9, 0, "strength"),

        # ══════════════════════════════════════════════════════
        # GENERAL FITNESS — balanced full-body routines
        # ══════════════════════════════════════════════════════

        # Beginner general fitness
        ("Push-Ups",              "chest",      "beginner",     "general_fitness", 3, "10-15", 45,
         "Hands shoulder-width on floor, keep body straight, lower chest to ground, push back up.",
         "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", 5, 1, "strength"),

        ("Plank Hold",            "core",       "beginner",     "general_fitness", 3, "30-45 sec", 30,
         "Hold push-up position on forearms, keep body straight from head to heels, engage core.",
         "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400", 3, 1, "strength"),

        ("Lunges",                "legs",       "beginner",     "general_fitness", 3, "10 each", 45,
         "Step forward, lower back knee toward floor until both legs at 90 degrees, push off front foot to return.",
         "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400", 5, 1, "strength"),

        ("Bodyweight Squats",     "legs",       "beginner",     "general_fitness", 3, "15-20",  45,
         "Stand feet shoulder-width, sit hips back and down, keep chest up, return to standing.",
         "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400", 4, 1, "strength"),

        ("Glute Bridges",         "legs",       "beginner",     "general_fitness", 3, "15",     30,
         "Lie on back, knees bent, feet flat. Drive hips up squeezing glutes at top, lower slowly.",
         "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", 3, 1, "strength"),

        ("Superman Hold",         "back",       "beginner",     "general_fitness", 3, "10",     30,
         "Lie face down, simultaneously lift arms and legs off the floor, hold 2-3 seconds, lower.",
         "https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400", 3, 1, "strength"),

        ("Jumping Jacks",         "full_body",  "beginner",     "general_fitness", 3, "30 sec", 30,
         "Stand upright, jump spreading legs while raising arms overhead, jump back to start.",
         "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", 6, 0, "cardio"),

        # Intermediate general fitness
        ("Russian Twists",        "core",       "intermediate", "general_fitness", 3, "15 each", 30,
         "Sit with knees bent, lean back 45 degrees, twist torso side to side, optionally hold a weight.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 4, 0, "strength"),

        ("Bicycle Crunches",      "core",       "intermediate", "general_fitness", 3, "15 each", 30,
         "Lie on back, alternate bringing opposite elbow to knee in a pedaling motion.",
         "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", 4, 0, "strength"),

        ("Dumbbell Lunges",       "legs",       "intermediate", "general_fitness", 3, "10 each", 60,
         "Hold dumbbells at sides, step forward into lunge, both knees at 90 degrees, push back to start.",
         "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400", 6, 0, "strength"),

        ("Renegade Rows",         "back",       "intermediate", "general_fitness", 3, "8 each",  60,
         "In push-up position holding dumbbells, row one dumbbell to hip while balancing on the other.",
         "https://images.unsplash.com/photo-1526401485004-46910ecc8e51?w=400", 6, 0, "strength"),

        # Advanced general fitness
        ("Pistol Squats",         "legs",       "advanced",     "general_fitness", 3, "5 each",  60,
         "Stand on one leg, extend the other forward, squat all the way down and back up.",
         "https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?w=400", 7, 0, "strength"),

        ("Handstand Push-Ups",    "shoulders",  "advanced",     "general_fitness", 3, "5-8",    90,
         "Kick up to handstand against wall, lower head toward floor, press back up.",
         "https://images.unsplash.com/photo-1598971457999-ca4ef48a9a71?w=400", 8, 0, "strength"),

        # ══════════════════════════════════════════════════════
        # ENDURANCE — sustained cardio + muscular endurance
        # ══════════════════════════════════════════════════════

        # Beginner endurance
        ("Treadmill Run",         "cardio",     "beginner",     "endurance", 1, "20-30 min", 0,
         "Run at moderate pace (conversational speed) on treadmill, maintain steady rhythmic breathing.",
         "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400", 15, 1, "cardio"),

        ("Cycling",               "legs",       "beginner",     "endurance", 1, "20-30 min", 0,
         "Steady-state cycling on stationary bike at moderate resistance, keep cadence 70-90 RPM.",
         "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400", 10, 1, "cardio"),

        ("Brisk Walking",         "cardio",     "beginner",     "endurance", 1, "30-40 min", 0,
         "Walk briskly at 3.5-4 mph, swing arms naturally, maintain upright posture.",
         "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400", 8, 1, "cardio"),

        ("Jump Rope",             "full_body",  "beginner",     "endurance", 3, "2 min",    60,
         "Steady pace jumping, focus on wrist rotation not arm movement. Build up duration gradually.",
         "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400", 9, 0, "cardio"),

        ("Bodyweight Circuit",    "full_body",  "beginner",     "endurance", 3, "10 each exercise", 60,
         "Perform squats, push-ups, lunges, and plank in sequence with minimal rest between exercises.",
         "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400", 7, 1, "strength"),

        # Intermediate endurance
        ("Rowing Machine",        "full_body",  "intermediate", "endurance", 1, "15-20 min", 0,
         "Sit on rower, drive legs first, lean back slightly, pull handle to lower ribs, return controlled.",
         "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=400", 12, 0, "cardio"),

        ("Stair Climber",         "legs",       "intermediate", "endurance", 1, "15-20 min", 0,
         "Use stair climber machine at moderate pace, keep posture upright, don't lean on handles.",
         "https://images.unsplash.com/photo-1590239926044-4131f5d0654d?w=400", 11, 0, "cardio"),

        ("Tempo Run",             "cardio",     "intermediate", "endurance", 1, "25-35 min", 0,
         "Run at a 'comfortably hard' pace you could sustain for about an hour. Builds lactate threshold.",
         "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400", 14, 0, "cardio"),

        ("Swimming Laps",         "full_body",  "intermediate", "endurance", 1, "20-30 min", 0,
         "Swim continuous laps at moderate effort. Excellent full-body low-impact cardio.",
         "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=400", 12, 1, "cardio"),

        # Advanced endurance
        ("HIIT Intervals",        "cardio",     "advanced",     "endurance", 8, "40 sec on / 20 sec off", 20,
         "Alternate maximum effort bursts with brief recovery. Use any modality: run, bike, row.",
         "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=400", 13, 0, "cardio"),

        ("Trail Running",         "cardio",     "advanced",     "endurance", 1, "40-60 min", 0,
         "Run on varied terrain including hills. Builds endurance, balance, and mental toughness.",
         "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400", 16, 0, "cardio"),

        # ══════════════════════════════════════════════════════
        # FLEXIBILITY — stretching, yoga, mobility
        # ══════════════════════════════════════════════════════

        # Beginner flexibility
        ("Yoga Sun Salutation",   "full_body",  "beginner",     "flexibility", 3, "5 rounds", 15,
         "Flow through upward salute, forward fold, plank, cobra, downward dog. Synchronize with breath.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 3, 1, "flexibility"),

        ("Hamstring Stretch",     "legs",       "beginner",     "flexibility", 2, "30 sec each side", 10,
         "Sit with one leg extended, reach toward toes keeping back straight. Hold without bouncing.",
         "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400", 1, 1, "flexibility"),

        ("Cat-Cow Stretch",       "back",       "beginner",     "flexibility", 3, "10 reps",  10,
         "On all fours, alternate arching back (cow) and rounding spine (cat). Move with breath.",
         "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", 1, 1, "flexibility"),

        ("Standing Quad Stretch", "legs",       "beginner",     "flexibility", 2, "30 sec each side", 10,
         "Stand on one leg, pull other heel toward glute. Keep knees together and hips squared.",
         "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400", 1, 1, "flexibility"),

        ("Child's Pose",          "back",       "beginner",     "flexibility", 2, "45-60 sec", 10,
         "Kneel, sit back on heels, fold forward with arms extended. Breathe deeply into the stretch.",
         "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", 1, 1, "flexibility"),

        ("Shoulder Stretch",      "shoulders",  "beginner",     "flexibility", 2, "30 sec each side", 10,
         "Cross one arm across your chest, use opposite hand to press it closer. Hold and breathe.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 1, 1, "flexibility"),

        ("Hip Flexor Stretch",    "legs",       "beginner",     "flexibility", 2, "30 sec each side", 10,
         "Kneel on one knee, front foot flat. Push hips forward gently until you feel a stretch in the hip.",
         "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400", 1, 1, "flexibility"),

        # Intermediate flexibility
        ("Pigeon Pose",           "legs",       "intermediate", "flexibility", 2, "45 sec each side", 15,
         "From downward dog, bring one knee behind same-side wrist, extend back leg. Fold forward if possible.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 1, 1, "flexibility"),

        ("Seated Spinal Twist",   "back",       "intermediate", "flexibility", 2, "30 sec each side", 10,
         "Sit with legs extended, cross one foot over opposite knee, twist toward bent knee. Look behind you.",
         "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", 1, 1, "flexibility"),

        ("Downward Dog",          "full_body",  "intermediate", "flexibility", 3, "30-45 sec",  10,
         "Hands and feet on floor, push hips up to form an inverted V. Pedal heels to deepen calf stretch.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 2, 1, "flexibility"),

        # Advanced flexibility
        ("King Pigeon Pose",      "legs",       "advanced",     "flexibility", 2, "30 sec each side", 15,
         "From pigeon pose, reach back and grab the rear foot, opening the chest and hip fully.",
         "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400", 2, 1, "flexibility"),

        ("Full Wheel Pose",       "back",       "advanced",     "flexibility", 3, "15-20 sec", 30,
         "Lie on back, place hands by ears, press up into a full backbend bridge. Requires good shoulder and spine flexibility.",
         "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400", 3, 1, "flexibility"),
    ]

    cursor.executemany("""
        INSERT INTO exercises
            (name, muscle_group, difficulty, goal_tag, sets, reps, rest_seconds, instructions, image_url, calories_per_set, is_low_impact, exercise_type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, exercises)

    conn.commit()
    conn.close()
    print("[OK] Database initialized and seeded with exercises.")


if __name__ == "__main__":
    init_db()
