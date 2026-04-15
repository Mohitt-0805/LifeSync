"""
FitNovaAI - Flask Backend
REST API for BMI calculation, user management, AI workout generation,
and OTP-based authentication with Gmail SMTP.
"""

from flask import Flask, request, jsonify, redirect
from flask_cors import CORS
from database import get_db, init_db
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from functools import wraps
import json, math, datetime, secrets, smtplib, os, re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")
CORS(app)

SECRET_KEY = os.getenv("SECRET_KEY", "fitnovaai-dev-secret")
GMAIL_ADDRESS = os.getenv("GMAIL_ADDRESS", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")

OTP_EXPIRY_MINUTES = 5
SESSION_EXPIRY_DAYS = 30


# ── Email Helper ────────────────────────────────────────────

def _smtp_configured():
    """Check if real Gmail SMTP credentials are set (not placeholders)."""
    if not GMAIL_ADDRESS or not GMAIL_APP_PASSWORD:
        return False
    placeholders = {"your-email@gmail.com", "xxxx-xxxx-xxxx-xxxx", ""}
    if GMAIL_ADDRESS.strip() in placeholders or GMAIL_APP_PASSWORD.strip() in placeholders:
        return False
    return True


def send_otp_email(to_email: str, otp_code: str, purpose: str = "login"):
    """Send OTP via Gmail SMTP. Returns True if email sent, False if dev mode / failed."""
    # Always log to console so developers can see it
    print(f"\n{'='*50}")
    print(f"  OTP for {to_email}: {otp_code}")
    print(f"  Purpose: {purpose} | Expires in {OTP_EXPIRY_MINUTES} min")
    print(f"{'='*50}\n")

    if not _smtp_configured():
        print(f"[DEV MODE] SMTP not configured — OTP shown on-screen")
        return False  # False = email not actually sent

    subject_map = {
        "login": "Your FitNovaAI Login Code",
        "register": "Welcome to FitNovaAI — Verify Your Email",
        "reset": "FitNovaAI Password Reset Code",
        "change": "FitNovaAI Password Change Verification",
    }

    subject = subject_map.get(purpose, "Your FitNovaAI Verification Code")

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; color: #f0f0f5; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #a259ff, #00e5ff); padding: 32px 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #fff;">⚡ FitNova<span style="opacity: 0.9;">AI</span></h1>
        </div>
        <div style="padding: 32px 24px;">
            <p style="color: #a0a0b8; font-size: 15px; margin-bottom: 8px;">Your verification code is:</p>
            <div style="background: rgba(162,89,255,0.12); border: 1px solid rgba(162,89,255,0.25); border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #a259ff;">{otp_code}</span>
            </div>
            <p style="color: #6a6a80; font-size: 13px; margin-top: 16px;">This code expires in {OTP_EXPIRY_MINUTES} minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0;">
            <p style="color: #6a6a80; font-size: 12px; text-align: center;">If you didn't request this code, please ignore this email.</p>
        </div>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["From"] = f"FitNovaAI <{GMAIL_ADDRESS}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(f"Your FitNovaAI verification code is: {otp_code}\nExpires in {OTP_EXPIRY_MINUTES} minutes.", "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_ADDRESS, GMAIL_APP_PASSWORD)
            server.sendmail(GMAIL_ADDRESS, to_email, msg.as_string())
        print(f"[OK] OTP email sent to {to_email}")
        return True
    except Exception as e:
        print(f"[ERR] Failed to send OTP email: {e}")
        return False


# ── Auth Helpers ────────────────────────────────────────────

def generate_otp():
    """Generate a 6-digit OTP."""
    return f"{secrets.randbelow(900000) + 100000}"


def generate_session_token():
    """Generate a secure session token."""
    return secrets.token_urlsafe(48)


def validate_email(email):
    """Basic email validation."""
    return bool(re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", email))


def validate_password(password):
    """Validate password strength: 8+ chars, 1 uppercase, 1 number."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    return True, "OK"


def get_current_user():
    """Extract user from session token in Authorization header."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None

    token = auth[7:]
    conn = get_db()
    session = conn.execute(
        "SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')",
        (token,)
    ).fetchone()

    if not session:
        conn.close()
        return None

    user = conn.execute("SELECT * FROM users WHERE id = ?", (session["user_id"],)).fetchone()
    conn.close()
    return dict(user) if user else None


def require_auth(f):
    """Decorator to require authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        request.current_user = user
        return f(*args, **kwargs)
    return decorated


# ── Helpers ─────────────────────────────────────────────────

def compute_bmi(weight_kg: float, height_m: float) -> tuple:
    """Return (bmi_value, category)."""
    bmi = weight_kg / (height_m ** 2)
    bmi = round(bmi, 1)
    if bmi < 18.5:
        cat = "Underweight"
    elif bmi < 25:
        cat = "Normal"
    elif bmi < 30:
        cat = "Overweight"
    else:
        cat = "Obese"
    return bmi, cat


def recommend_exercises(bmi_cat: str, goal: str, fitness_level: str, age: int, split_days: int = 3):
    """
    Smart AI recommendation engine supporting multi-day splits.
    Generates a full weekly schedule based on the selected split frequency.
    """
    conn = get_db()

    valid_goals = {"weight_loss", "muscle_gain", "general_fitness", "endurance", "flexibility"}
    goal_tag = goal if goal in valid_goals else "general_fitness"

    level_map = {
        "beginner":     ("beginner",),
        "intermediate": ("beginner", "intermediate"),
        "advanced":     ("beginner", "intermediate", "advanced"),
    }
    allowed = level_map.get(fitness_level, ("beginner",))
    placeholders = ",".join("?" for _ in allowed)
    require_low_impact = (bmi_cat == "Obese") or (age >= 55)

    # Determine the split strategy based on number of days
    splits = {
        3: [
            {"day": 1, "focus": "Push & Core", "muscles": ["chest", "shoulders", "core", "arms"], "ex_count": 5},
            {"day": 2, "focus": "Pull & Cardio", "muscles": ["back", "arms", "cardio", "full_body"], "ex_count": 5},
            {"day": 3, "focus": "Legs", "muscles": ["legs", "core"], "ex_count": 5}
        ],
        4: [
            {"day": 1, "focus": "Upper Body", "muscles": ["chest", "back", "arms", "shoulders"], "ex_count": 5},
            {"day": 2, "focus": "Lower Body", "muscles": ["legs", "core"], "ex_count": 5},
            {"day": 3, "focus": "Push & Cardio", "muscles": ["chest", "shoulders", "cardio"], "ex_count": 5},
            {"day": 4, "focus": "Pull & Core", "muscles": ["back", "arms", "full_body", "core"], "ex_count": 5}
        ],
        5: [
            {"day": 1, "focus": "Chest & Shoulders", "muscles": ["chest", "shoulders", "core"], "ex_count": 5},
            {"day": 2, "focus": "Back & Arms", "muscles": ["back", "arms"], "ex_count": 5},
            {"day": 3, "focus": "Legs", "muscles": ["legs"], "ex_count": 5},
            {"day": 4, "focus": "Upper Body Mix", "muscles": ["chest", "back", "arms", "shoulders"], "ex_count": 5},
            {"day": 5, "focus": "Full Body & Cardio", "muscles": ["full_body", "cardio", "core"], "ex_count": 5}
        ],
        6: [
            {"day": 1, "focus": "Push (Chest/Triceps/Shoulders)", "muscles": ["chest", "shoulders", "arms"], "ex_count": 5},
            {"day": 2, "focus": "Pull (Back/Biceps)", "muscles": ["back", "arms"], "ex_count": 5},
            {"day": 3, "focus": "Legs", "muscles": ["legs"], "ex_count": 5},
            {"day": 4, "focus": "Push & Core", "muscles": ["chest", "shoulders", "core"], "ex_count": 5},
            {"day": 5, "focus": "Pull & Cardio", "muscles": ["back", "arms", "cardio"], "ex_count": 5},
            {"day": 6, "focus": "Legs & Full Body", "muscles": ["legs", "full_body"], "ex_count": 5}
        ]
    }
    
    schedule_plan = splits.get(split_days, splits[3])
    
    def fetch_for_day(muscles, count):
        if count <= 0: return []
        safety_filter = "AND is_low_impact = 1" if require_low_impact else ""
        muscles_in = ",".join(f"'{m}'" for m in muscles)
        query = f"""
            SELECT * FROM exercises
            WHERE goal_tag = ? AND difficulty IN ({placeholders})
              AND muscle_group IN ({muscles_in})
              {safety_filter}
            ORDER BY RANDOM()
        """
        params = (goal_tag, *allowed)
        candidates = conn.execute(query, params).fetchall()
        
        selected = []
        used_names = set()
        for row in candidates:
            if row["name"] not in used_names and len(selected) < count:
                selected.append(dict(row))
                used_names.add(row["name"])
                
        # If we couldn't find enough, fallback safely
        if len(selected) < count:
            fb = f"SELECT * FROM exercises WHERE goal_tag = ? AND difficulty IN ({placeholders}) ORDER BY RANDOM() LIMIT {count - len(selected)}"
            extras = conn.execute(fb, (goal_tag, *allowed)).fetchall()
            for row in extras:
                if row["name"] not in used_names:
                    selected.append(dict(row))
                    used_names.add(row["name"])
        return selected

    schedule = []
    
    for day_plan in schedule_plan:
        exs = fetch_for_day(day_plan["muscles"], day_plan["ex_count"])
        final_exs = []
        for ex in exs:
            set_modifier = 0
            if bmi_cat == "Obese" or bmi_cat == "Underweight": set_modifier = -1
            elif bmi_cat == "Normal": set_modifier = 1
            if age >= 55: set_modifier -= 1
            elif age < 18 or age >= 40: set_modifier = min(set_modifier, 0)
            
            ex["sets"] = max(2, ex["sets"] + set_modifier)
            if goal_tag == "weight_loss" and ex.get("exercise_type") == "strength":
                ex["rest_seconds"] = max(20, ex["rest_seconds"] - 15)
            elif goal_tag == "muscle_gain":
                ex["rest_seconds"] = max(60, ex["rest_seconds"])
                
            ex["est_calories"] = round(ex.get("calories_per_set", 0) * ex["sets"], 1)
            final_exs.append(ex)
            
        schedule.append({
            "day": day_plan["day"],
            "focus": day_plan["focus"],
            "exercises": final_exs,
            "est_calories": sum(e["est_calories"] for e in final_exs)
        })

    conn.close()

    warmups = {
        "weight_loss":     "5 min brisk walking or light jog + leg swings, arm circles, hip rotations",
        "muscle_gain":     "5 min light cardio + 2 warm-up sets at 50% weight for the first exercise",
        "general_fitness": "5 min jumping jacks or walking + dynamic stretches (leg swings, torso twists)",
        "endurance":       "5 min easy-pace walking/cycling gradually increasing to moderate intensity",
        "flexibility":     "3 min gentle movement (walking, arm swings) to raise body temperature",
    }
    cooldowns = {
        "weight_loss":     "5 min slow walking + static stretches for legs, hips, and shoulders (30s each)",
        "muscle_gain":     "5 min light walking + foam rolling on worked muscles + static stretches",
        "general_fitness": "5 min walking + full-body static stretching targeting all major muscle groups",
        "endurance":       "5-10 min gradual pace reduction + deep breathing + full-body stretches",
        "flexibility":     "2 min in Savasana (lying flat, eyes closed) with deep diaphragmatic breathing",
    }

    total_weekly_calories = sum(day["est_calories"] for day in schedule)

    workout = {
        "warm_up": warmups.get(goal_tag, warmups["general_fitness"]),
        "schedule": schedule,
        "cool_down": cooldowns.get(goal_tag, cooldowns["general_fitness"]),
        "total_est_calories": total_weekly_calories,
        "note": _ai_note(bmi_cat, goal_tag, fitness_level, age),
        "workout_focus": _workout_focus(goal_tag),
        "split_days": split_days
    }
    return workout


def _workout_focus(goal):
    return {
        "weight_loss":     "High calorie burn with a mix of cardio intervals and bodyweight strength moves",
        "muscle_gain":     "Progressive resistance training targeting major muscle groups for hypertrophy",
        "general_fitness": "Balanced full-body routine combining strength, stability, and light cardio",
        "endurance":       "Sustained cardiovascular conditioning with muscular endurance support",
        "flexibility":     "Mobility and range-of-motion work through targeted stretches and yoga flows",
    }.get(goal, "Balanced full-body fitness routine")


def _ai_note(bmi_cat, goal, level, age):
    tips = []
    if bmi_cat == "Underweight":
        tips.append("Your BMI indicates underweight status. Focus on a calorie surplus of 300-500 kcal/day with protein-rich meals (1.6-2g protein per kg bodyweight) to support healthy weight gain.")
        if goal == "weight_loss":
            tips.append("NOTE: Weight loss may not be appropriate for your BMI. Consider switching to Muscle Gain or General Fitness.")
    elif bmi_cat == "Overweight":
        tips.append("Pair this workout with a moderate calorie deficit (300-500 kcal/day below maintenance) and prioritize protein intake to preserve muscle mass while losing fat.")
    elif bmi_cat == "Obese":
        tips.append("Your workout has been adjusted with lower-impact exercises for joint safety. Start slow, prioritize consistency over intensity, and consult a physician before beginning any new exercise program.")
    elif bmi_cat == "Normal":
        tips.append("Your BMI is in the healthy range. This workout is optimized for your selected goal.")

    if goal == "weight_loss":
        tips.append("Keep rest periods short (30-45s) to maintain an elevated heart rate for maximum calorie burn. Aim for 3-5 sessions per week.")
    elif goal == "muscle_gain":
        tips.append("Progressive overload is key: increase weight by 2.5-5% or add 1-2 reps each week. Rest 60-120 seconds between sets. Aim for 3-4 sessions per week.")
    elif goal == "endurance":
        tips.append("Stay well-hydrated, maintain steady breathing, and gradually increase duration by 10% per week. Don't skip rest days.")
    elif goal == "flexibility":
        tips.append("Never bounce during stretches. Hold each position for at least 20-30 seconds and breathe deeply. Practice daily for best results.")
    elif goal == "general_fitness":
        tips.append("This balanced routine builds a solid fitness foundation. Aim for 3 sessions per week with at least one rest day between sessions.")

    if level == "beginner":
        tips.append("Focus on mastering proper form before increasing weight or intensity. Consider working with a trainer for the first few sessions.")
    elif level == "intermediate":
        tips.append("You're ready to progressively challenge yourself. Track your weights and reps to ensure steady improvement.")
    elif level == "advanced":
        tips.append("Periodize your training with deload weeks every 4-6 weeks to prevent overtraining and plateaus.")

    if age >= 55:
        tips.append("Listen to your body and allow extra recovery time. Low-impact exercises have been prioritized for joint health.")
    elif age < 18:
        tips.append("At your age, focus on bodyweight exercises and technique. Avoid maximal heavy lifting until physically mature.")

    return " ".join(tips)


# ══════════════════════════════════════════════════════════════
# AUTH API ROUTES
# ══════════════════════════════════════════════════════════════

@app.route("/login")
def login_page():
    return app.send_static_file("login.html")


@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    """Step 1: Send OTP to email address."""
    data = request.json
    email = (data.get("email") or "").strip().lower()
    purpose = data.get("purpose", "login")

    if not email or not validate_email(email):
        return jsonify({"error": "Please enter a valid email address"}), 400

    # Rate limit: max 1 OTP per email per minute
    conn = get_db()
    recent = conn.execute(
        """SELECT COUNT(*) as cnt FROM otp_codes
           WHERE email = ? AND created_at > datetime('now', '-1 minute') AND is_used = 0""",
        (email,)
    ).fetchone()
    if recent and recent["cnt"] >= 1:
        conn.close()
        return jsonify({"error": "Please wait before requesting another code"}), 429

    # Invalidate old unused OTPs for this email
    conn.execute(
        "UPDATE otp_codes SET is_used = 1 WHERE email = ? AND is_used = 0",
        (email,)
    )

    # Generate and store OTP
    otp = generate_otp()
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)

    conn.execute(
        "INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, ?, ?)",
        (email, otp, purpose, expires.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()

    # Check if user exists
    user = conn.execute("SELECT id, name, password_hash FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()

    # Send email
    email_sent = send_otp_email(email, otp, purpose)

    response = {
        "message": "Verification code sent to your email",
        "email": email,
        "is_new_user": user is None,
        "has_password": bool(user and user["password_hash"]),
        "email_sent": email_sent,
    }

    # In dev mode (SMTP not configured), include OTP in response so frontend can show it
    if not email_sent:
        response["dev_otp"] = otp

    return jsonify(response)


@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    """Step 2: Verify OTP code."""
    data = request.json
    email = (data.get("email") or "").strip().lower()
    otp_code = (data.get("otp_code") or "").strip()

    if not email or not otp_code:
        return jsonify({"error": "Email and OTP code are required"}), 400

    conn = get_db()
    otp_record = conn.execute(
        """SELECT * FROM otp_codes
           WHERE email = ? AND otp_code = ? AND is_used = 0
             AND expires_at > datetime('now')
           ORDER BY created_at DESC LIMIT 1""",
        (email, otp_code)
    ).fetchone()

    if not otp_record:
        conn.close()
        return jsonify({"error": "Invalid or expired verification code"}), 400

    # Mark OTP as used
    conn.execute("UPDATE otp_codes SET is_used = 1 WHERE id = ?", (otp_record["id"],))
    conn.commit()

    # Check if user exists
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if user:
        # Existing user → create session
        token = generate_session_token()
        expires = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
        conn.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
            (user["id"], token, expires.strftime("%Y-%m-%d %H:%M:%S"))
        )
        # Mark as verified
        conn.execute("UPDATE users SET is_verified = 1 WHERE id = ?", (user["id"],))
        conn.commit()
        conn.close()

        user_dict = dict(user)
        user_dict.pop("password_hash", None)

        return jsonify({
            "message": "Login successful",
            "token": token,
            "user": user_dict,
            "is_new_user": False,
            "has_password": bool(user["password_hash"]),
        })
    else:
        conn.close()
        # New user → return verification token for registration
        return jsonify({
            "message": "Email verified. Please complete registration.",
            "verified_email": email,
            "is_new_user": True,
            "verification_token": secrets.token_urlsafe(32),
        })


@app.route("/api/auth/register", methods=["POST"])
def auth_register():
    """Step 3 (new users): Complete registration after OTP verification."""
    data = request.json
    email = (data.get("email") or "").strip().lower()
    name = (data.get("name") or "").strip()
    password = data.get("password", "")
    age = data.get("age")
    gender = data.get("gender", "other")
    goal = data.get("goal", "general_fitness")
    fitness_level = data.get("fitness_level", "beginner")

    if not email or not name:
        return jsonify({"error": "Name and email are required"}), 400

    if not password:
        return jsonify({"error": "Password is required"}), 400

    valid, msg = validate_password(password)
    if not valid:
        return jsonify({"error": msg}), 400

    conn = get_db()

    # Check if email already registered
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "An account with this email already exists"}), 409

    password_hash = generate_password_hash(password)

    try:
        cursor = conn.execute(
            """INSERT INTO users (name, email, age, gender, goal, fitness_level, password_hash, is_verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, 1)""",
            (name, email, int(age) if age else None, gender, goal, fitness_level, password_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 400

    # Create session
    token = generate_session_token()
    expires = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
    conn.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user_id, token, expires.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()

    user_dict = dict(user)
    user_dict.pop("password_hash", None)

    return jsonify({
        "message": f"Welcome to FitNovaAI, {name}!",
        "token": token,
        "user": user_dict,
    }), 201


@app.route("/api/auth/login-password", methods=["POST"])
def login_password():
    """Login with email + password (alternative to OTP)."""
    data = request.json
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()

    if not user or not user["password_hash"]:
        conn.close()
        return jsonify({"error": "Invalid email or password"}), 401

    if not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"error": "Invalid email or password"}), 401

    # Create session
    token = generate_session_token()
    expires = datetime.datetime.utcnow() + datetime.timedelta(days=SESSION_EXPIRY_DAYS)
    conn.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
        (user["id"], token, expires.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()

    user_dict = dict(user)
    user_dict.pop("password_hash", None)
    conn.close()

    return jsonify({
        "message": f"Welcome back, {user_dict['name']}!",
        "token": token,
        "user": user_dict,
    })


@app.route("/api/auth/forgot-password", methods=["POST"])
def forgot_password():
    """Send OTP for password reset."""
    data = request.json
    email = (data.get("email") or "").strip().lower()

    if not email or not validate_email(email):
        return jsonify({"error": "Please enter a valid email address"}), 400

    conn = get_db()
    user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if not user:
        conn.close()
        # Don't reveal if email exists
        return jsonify({"message": "If an account exists, a reset code has been sent."})

    # Rate limit
    recent = conn.execute(
        """SELECT COUNT(*) as cnt FROM otp_codes
           WHERE email = ? AND created_at > datetime('now', '-1 minute') AND is_used = 0""",
        (email,)
    ).fetchone()
    if recent and recent["cnt"] >= 1:
        conn.close()
        return jsonify({"error": "Please wait before requesting another code"}), 429

    conn.execute("UPDATE otp_codes SET is_used = 1 WHERE email = ? AND is_used = 0", (email,))

    otp = generate_otp()
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_EXPIRY_MINUTES)
    conn.execute(
        "INSERT INTO otp_codes (email, otp_code, purpose, expires_at) VALUES (?, ?, 'reset', ?)",
        (email, otp, expires.strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()

    email_sent = send_otp_email(email, otp, "reset")
    response = {"message": "If an account exists, a reset code has been sent.", "email": email}
    if not email_sent:
        response["dev_otp"] = otp
    return jsonify(response)


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    """Reset password after OTP verification."""
    data = request.json
    email = (data.get("email") or "").strip().lower()
    otp_code = (data.get("otp_code") or "").strip()
    new_password = data.get("new_password", "")

    if not email or not otp_code or not new_password:
        return jsonify({"error": "All fields are required"}), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({"error": msg}), 400

    conn = get_db()
    otp_record = conn.execute(
        """SELECT * FROM otp_codes
           WHERE email = ? AND otp_code = ? AND is_used = 0
             AND purpose = 'reset' AND expires_at > datetime('now')
           ORDER BY created_at DESC LIMIT 1""",
        (email, otp_code)
    ).fetchone()

    if not otp_record:
        conn.close()
        return jsonify({"error": "Invalid or expired verification code"}), 400

    conn.execute("UPDATE otp_codes SET is_used = 1 WHERE id = ?", (otp_record["id"],))

    password_hash = generate_password_hash(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE email = ?", (password_hash, email))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password reset successfully. You can now login."})


@app.route("/api/auth/change-password", methods=["POST"])
@require_auth
def change_password():
    """Change password (requires current password)."""
    data = request.json
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")

    if not current_password or not new_password:
        return jsonify({"error": "Current and new passwords are required"}), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({"error": msg}), 400

    user = request.current_user
    conn = get_db()
    db_user = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user["id"],)).fetchone()

    if not db_user or not db_user["password_hash"]:
        conn.close()
        return jsonify({"error": "No password set for this account"}), 400

    if not check_password_hash(db_user["password_hash"], current_password):
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 401

    password_hash = generate_password_hash(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password changed successfully"})


@app.route("/api/auth/set-password", methods=["POST"])
@require_auth
def set_password():
    """Set password for the first time (for OTP-only users)."""
    data = request.json
    new_password = data.get("new_password", "")

    if not new_password:
        return jsonify({"error": "Password is required"}), 400

    valid, msg = validate_password(new_password)
    if not valid:
        return jsonify({"error": msg}), 400

    user = request.current_user
    conn = get_db()

    password_hash = generate_password_hash(new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (password_hash, user["id"]))
    conn.commit()
    conn.close()

    return jsonify({"message": "Password set successfully"})


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    """Get current authenticated user."""
    user = get_current_user()
    if not user:
        return jsonify({"error": "Not authenticated"}), 401
    user.pop("password_hash", None)
    return jsonify({"user": user})


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    """Invalidate current session."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        conn = get_db()
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()
        conn.close()
    return jsonify({"message": "Logged out successfully"})


# ══════════════════════════════════════════════════════════════
# EXISTING API ROUTES
# ══════════════════════════════════════════════════════════════

@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json
    required = ["name", "email", "age"]
    if not all(data.get(k) for k in required):
        return jsonify({"error": "name, email, and age are required"}), 400

    conn = get_db()
    try:
        cursor = conn.execute(
            """INSERT INTO users (name, email, age, gender, goal, fitness_level)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (data["name"], data["email"], int(data["age"]),
             data.get("gender", "other"),
             data.get("goal", "general_fitness"),
             data.get("fitness_level", "beginner"))
        )
        conn.commit()
        user_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        if "UNIQUE" in str(e):
            row = conn = get_db()
            row = conn.execute("SELECT * FROM users WHERE email = ?", (data["email"],)).fetchone()
            if row:
                conn.close()
                return jsonify({"user": dict(row)}), 200
        return jsonify({"error": str(e)}), 400

    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return jsonify({"user": dict(user)}), 201


@app.route("/api/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": dict(user)})


@app.route("/api/user/<int:user_id>", methods=["PUT"])
def update_user(user_id):
    data = request.json
    conn = get_db()
    conn.execute(
        """UPDATE users SET name=?, age=?, gender=?, goal=?, fitness_level=?
           WHERE id=?""",
        (data.get("name"), int(data.get("age", 25)),
         data.get("gender", "other"),
         data.get("goal", "general_fitness"),
         data.get("fitness_level", "beginner"),
         user_id)
    )
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return jsonify({"user": dict(user)})


@app.route("/api/calculate_bmi", methods=["POST"])
def calculate_bmi():
    data = request.json
    weight = float(data.get("weight_kg", 0))
    height = float(data.get("height_m", 0))
    user_id = data.get("user_id")

    if weight <= 0 or height <= 0:
        return jsonify({"error": "Valid weight and height are required"}), 400

    bmi, category = compute_bmi(weight, height)

    if user_id:
        conn = get_db()
        conn.execute(
            "INSERT INTO bmi_history (user_id, weight_kg, height_m, bmi_value, category) VALUES (?, ?, ?, ?, ?)",
            (user_id, weight, height, bmi, category)
        )
        conn.commit()
        conn.close()

    return jsonify({
        "bmi": bmi,
        "category": category,
        "weight_kg": weight,
        "height_m": height,
    })


@app.route("/api/bmi_history/<int:user_id>", methods=["GET"])
def bmi_history(user_id):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM bmi_history WHERE user_id = ? ORDER BY recorded_at DESC LIMIT 20",
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({"history": [dict(r) for r in rows]})


@app.route("/api/generate_workout", methods=["POST"])
def generate_workout():
    data = request.json
    weight = float(data.get("weight_kg", 0))
    height = float(data.get("height_m", 0))
    goal = data.get("goal", "general_fitness")
    fitness_level = data.get("fitness_level", "beginner")
    age = int(data.get("age", 25))
    user_id = data.get("user_id")
    split_days = int(data.get("split_days", 3))

    if weight <= 0 or height <= 0:
        return jsonify({"error": "Valid weight and height are required"}), 400

    bmi, category = compute_bmi(weight, height)
    workout = recommend_exercises(category, goal, fitness_level, age, split_days)
    workout["bmi"] = bmi
    workout["bmi_category"] = category

    if user_id:
        conn = get_db()
        conn.execute(
            "INSERT INTO workout_history (user_id, workout_json) VALUES (?, ?)",
            (user_id, json.dumps(workout))
        )
        conn.commit()
        conn.close()

    return jsonify(workout)


@app.route("/api/exercises", methods=["GET"])
def list_exercises():
    goal = request.args.get("goal")
    difficulty = request.args.get("difficulty")
    conn = get_db()
    query = "SELECT * FROM exercises WHERE 1=1"
    params = []
    if goal:
        query += " AND goal_tag = ?"
        params.append(goal)
    if difficulty:
        query += " AND difficulty = ?"
        params.append(difficulty)
    query += " ORDER BY muscle_group, name"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify({"exercises": [dict(r) for r in rows]})


# ── Run ─────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    app.run(debug=True, port=5000)
