/**
 * FitNovaAI — Frontend Application
 * Handles BMI calculation, workout generation, user profiles, exercise browsing,
 * and authentication state management.
 */

const API = "";  // Same origin

// ── State ──────────────────────────────────────────────────
let currentUser = null;
let authToken = null;
let selectedLevel = "beginner";

// ── DOM Ready ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    initParticles();
    initNavbar();
    initHeroCounters();
    initBMIForm();
    initWorkoutForm();
    initLevelSelector();
    initExerciseLibrary();
    initScrollAnimations();
    initAuth();
});

// ═══════════════════════════════════════════════════════════
// Authentication
// ═══════════════════════════════════════════════════════════
async function initAuth() {
    authToken = localStorage.getItem("fitnovaai_token");
    const storedUser = localStorage.getItem("fitnovaai_user");

    if (authToken && storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            updateAuthUI(true);
            loadBMIHistory();
        } catch {
            currentUser = null;
        }

        // Verify token is still valid
        try {
            const res = await fetch(`${API}/api/auth/me`, {
                headers: { "Authorization": `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                localStorage.setItem("fitnovaai_user", JSON.stringify(currentUser));
                updateAuthUI(true);
            } else {
                // Token expired
                handleLogout(false);
            }
        } catch {
            // Server might be down, keep cached user
        }
    } else {
        updateAuthUI(false);
    }

    // Event listeners
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", () => handleLogout(true));

    const changePasswordBtn = document.getElementById("changePasswordBtn");
    if (changePasswordBtn) changePasswordBtn.addEventListener("click", openChangePasswordModal);

    const modalCloseBtn = document.getElementById("modalCloseBtn");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeChangePasswordModal);

    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) changePasswordForm.addEventListener("submit", handleChangePassword);

    // Close modal on overlay click
    const modalOverlay = document.getElementById("changePasswordModal");
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeChangePasswordModal();
        });
    }

    // User menu toggle
    const avatarBtn = document.getElementById("userAvatarBtn");
    if (avatarBtn) {
        avatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            document.getElementById("userDropdown").classList.toggle("open");
        });
        // Close dropdown on outside click
        document.addEventListener("click", () => {
            document.getElementById("userDropdown")?.classList.remove("open");
        });
    }
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById("navLoginBtn");
    const userMenu = document.getElementById("userMenu");
    const guestCard = document.getElementById("guestProfileCard");
    const loggedInCard = document.getElementById("loggedInProfileCard");

    if (isLoggedIn && currentUser) {
        loginBtn?.classList.add("hidden");
        userMenu?.classList.remove("hidden");

        const initial = (currentUser.name || "U").charAt(0).toUpperCase();
        const els = {
            userInitial: initial,
            userNameNav: currentUser.name || "User",
            dropdownName: currentUser.name || "User",
            dropdownEmail: currentUser.email || "",
            profileInitial: initial,
            profileName: currentUser.name || "User",
            profileEmail: currentUser.email || "",
            profileAge: currentUser.age ? `${currentUser.age} years` : "—",
            profileGoal: formatGoal(currentUser.goal),
            profileLevel: capitalize(currentUser.fitness_level || "beginner"),
            profileJoined: currentUser.created_at ? new Date(currentUser.created_at).toLocaleDateString() : "—",
        };
        for (const [id, val] of Object.entries(els)) {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        }

        guestCard?.classList.add("hidden");
        loggedInCard?.classList.remove("hidden");
    } else {
        loginBtn?.classList.remove("hidden");
        userMenu?.classList.add("hidden");
        guestCard?.classList.remove("hidden");
        loggedInCard?.classList.add("hidden");
    }
}

function formatGoal(goal) {
    const goals = {
        weight_loss: "Weight Loss",
        muscle_gain: "Muscle Gain",
        general_fitness: "General Fitness",
        endurance: "Endurance",
        flexibility: "Flexibility",
    };
    return goals[goal] || "General Fitness";
}

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

async function handleLogout(callApi = true) {
    if (callApi && authToken) {
        try {
            await fetch(`${API}/api/auth/logout`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${authToken}` },
            });
        } catch { /* ignore */ }
    }

    localStorage.removeItem("fitnovaai_token");
    localStorage.removeItem("fitnovaai_user");
    currentUser = null;
    authToken = null;
    updateAuthUI(false);

    if (callApi) {
        showToast("Logged out successfully", "success");
    }
}

function openChangePasswordModal() {
    document.getElementById("userDropdown")?.classList.remove("open");
    document.getElementById("changePasswordModal")?.classList.remove("hidden");
    document.getElementById("currentPassword")?.focus();
}

function closeChangePasswordModal() {
    document.getElementById("changePasswordModal")?.classList.add("hidden");
    document.getElementById("changePasswordForm")?.reset();
}

async function handleChangePassword(e) {
    e.preventDefault();
    const currentPw = document.getElementById("currentPassword").value;
    const newPw = document.getElementById("newPassword").value;
    const confirmPw = document.getElementById("confirmNewPassword").value;

    if (!currentPw || !newPw) return showToast("Please fill all fields", "error");
    if (newPw !== confirmPw) return showToast("New passwords don't match", "error");
    if (newPw.length < 8) return showToast("Password must be at least 8 characters", "error");

    const btn = document.getElementById("changePasswordSubmitBtn");
    btn.classList.add("loading");

    try {
        const res = await fetch(`${API}/api/auth/change-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                current_password: currentPw,
                new_password: newPw,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed");

        showToast("Password changed successfully! 🔐", "success");
        closeChangePasswordModal();
    } catch (err) {
        showToast(err.message, "error");
    } finally {
        btn.classList.remove("loading");
    }
}


// ═══════════════════════════════════════════════════════════
// Particles Background
// ═══════════════════════════════════════════════════════════
function initParticles() {
    const container = document.getElementById("particles");
    for (let i = 0; i < 50; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${2 + Math.random() * 4}px;
            height: ${2 + Math.random() * 4}px;
            animation-delay: ${Math.random() * 6}s;
            animation-duration: ${4 + Math.random() * 8}s;
        `;
        container.appendChild(p);
    }
}

// ═══════════════════════════════════════════════════════════
// Navbar
// ═══════════════════════════════════════════════════════════
function initNavbar() {
    const navbar = document.getElementById("navbar");
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");

    window.addEventListener("scroll", () => {
        navbar.classList.toggle("scrolled", window.scrollY > 50);
        updateActiveNav();
    });

    toggle.addEventListener("click", () => {
        links.classList.toggle("open");
        toggle.classList.toggle("active");
    });

    document.querySelectorAll(".nav-link").forEach(link => {
        link.addEventListener("click", () => {
            links.classList.remove("open");
            toggle.classList.remove("active");
        });
    });
}

function updateActiveNav() {
    const sections = document.querySelectorAll("section[id], .hero[id]");
    let current = "";
    sections.forEach(sec => {
        const top = sec.offsetTop - 100;
        if (window.scrollY >= top) current = sec.id;
    });
    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.section === current);
    });
}

// ═══════════════════════════════════════════════════════════
// Hero Counter Animation
// ═══════════════════════════════════════════════════════════
function initHeroCounters() {
    const counters = document.querySelectorAll(".stat-number[data-target]");
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    counters.forEach(c => observer.observe(c));
}

function animateCounter(el) {
    const target = +el.dataset.target;
    const duration = 1500;
    const start = performance.now();
    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════
// BMI Calculator
// ═══════════════════════════════════════════════════════════
function initBMIForm() {
    document.getElementById("bmiForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById("bmiWeight").value);
        const heightCm = parseFloat(document.getElementById("bmiHeight").value);
        if (!weight || !heightCm) return showToast("Please enter valid weight and height", "error");

        const heightM = heightCm / 100;
        const btn = document.getElementById("bmiSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/calculate_bmi`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weight_kg: weight,
                    height_m: heightM,
                    user_id: currentUser?.id || null,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            displayBMIResult(data);
            showToast("BMI calculated successfully!", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });
}

function displayBMIResult(data) {
    const card = document.getElementById("bmiResultCard");
    card.style.display = "block";
    setTimeout(() => card.classList.add("visible"), 10);

    const bmiEl = document.getElementById("bmiValue");
    animateValue(bmiEl, 0, data.bmi, 1000);

    const ring = document.getElementById("bmiRingProgress");
    const circumference = 2 * Math.PI * 52;
    ring.style.strokeDasharray = circumference;
    const progress = Math.min(data.bmi / 40, 1);
    ring.style.strokeDashoffset = circumference * (1 - progress);

    const colors = {
        Underweight: "#36b5f4",
        Normal: "#00e676",
        Overweight: "#ffab40",
        Obese: "#ff5252",
    };
    ring.style.stroke = colors[data.category] || "#a259ff";

    const badge = document.getElementById("bmiCategoryBadge");
    badge.textContent = data.category;
    badge.className = `bmi-category-badge cat-${data.category.toLowerCase()}`;

    const descriptions = {
        Underweight: "Your BMI indicates you're underweight. Consider consulting a nutritionist for a healthy weight gain plan.",
        Normal: "Great news! Your BMI is in the healthy range. Maintain your lifestyle with regular exercise and balanced nutrition.",
        Overweight: "Your BMI indicates you're overweight. A combination of cardio and strength training can help reach a healthier weight.",
        Obese: "Your BMI indicates obesity. We recommend consulting a healthcare provider and starting with low-impact exercises.",
    };
    document.getElementById("bmiDescription").textContent = descriptions[data.category] || "";
}

function animateValue(el, start, end, duration) {
    const startTime = performance.now();
    function update(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = (start + (end - start) * eased).toFixed(1);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════
// Level Selector
// ═══════════════════════════════════════════════════════════
function initLevelSelector() {
    document.querySelectorAll(".level-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            selectedLevel = btn.dataset.level;
            document.getElementById("wkLevel").value = selectedLevel;
        });
    });
}

// ═══════════════════════════════════════════════════════════
// AI Workout Generator
// ═══════════════════════════════════════════════════════════
function initWorkoutForm() {
    document.getElementById("workoutForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const weight = parseFloat(document.getElementById("wkWeight").value);
        const heightCm = parseFloat(document.getElementById("wkHeight").value);
        const age = parseInt(document.getElementById("wkAge").value);
        const goal = document.getElementById("wkGoal").value;
        const splitDays = document.getElementById("wkSplit")?.value || 3;

        if (!weight || !heightCm || !age) return showToast("Please fill in all fields", "error");

        const btn = document.getElementById("workoutSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/generate_workout`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weight_kg: weight,
                    height_m: heightCm / 100,
                    age: age,
                    goal: goal,
                    fitness_level: selectedLevel,
                    split_days: parseInt(splitDays),
                    user_id: currentUser?.id || null,
                }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            displayWorkout(data);
            showToast("Workout generated by AI! 🤖", "success");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });
}

function displayWorkout(data) {
    const results = document.getElementById("workoutResults");
    results.style.display = "block";
    setTimeout(() => results.classList.add("visible"), 10);

    const goalLabels = {
        weight_loss: "🔥 Weight Loss",
        muscle_gain: "💪 Muscle Gain",
        general_fitness: "🏃 General Fitness",
        endurance: "❤️ Endurance",
        flexibility: "🧘 Flexibility",
    };

    const userGoal = document.getElementById("wkGoal").value;
    const goalLabel = goalLabels[userGoal] || "General Fitness";
    const titleSplit = data.split_days ? `${data.split_days}-Day Split` : "Workout";

    document.getElementById("workoutSummary").innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="summary-label">BMI</span>
                <span class="summary-value">${data.bmi}</span>
                <span class="summary-sub cat-${data.bmi_category.toLowerCase()}">${data.bmi_category}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Goal</span>
                <span class="summary-value">${goalLabel}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Structure</span>
                <span class="summary-value">${titleSplit}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Weekly Kcal</span>
                <span class="summary-value">${data.total_est_calories}</span>
                <span class="summary-sub">kcal</span>
            </div>
        </div>
        ${data.workout_focus ? `<div class="workout-focus-bar"><strong>Focus:</strong> ${data.workout_focus}</div>` : ""}
        <div class="workout-phases">
            <div class="phase warm-up"><span class="phase-icon">🔄</span><strong>Warm-Up (Daily):</strong> ${data.warm_up}</div>
            <div class="phase cool-down"><span class="phase-icon">🧊</span><strong>Cool-Down (Daily):</strong> ${data.cool_down}</div>
        </div>
        <div class="ai-note">
            <span class="ai-icon">🤖</span>
            <p><strong>AI Recommendation:</strong> ${data.note}</p>
        </div>
    `;

    const tbody = document.getElementById("splitTableBody");
    tbody.innerHTML = "";

    const typeLabels = { cardio: "Cardio", strength: "Strength", flexibility: "Flexibility" };
    const typeColors = { cardio: "#ff6b6b", strength: "#a259ff", flexibility: "#00e5ff" };

    if (data.schedule && data.schedule.length > 0) {
        data.schedule.forEach((day, index) => {
            const tr = document.createElement("tr");
            tr.style.animationDelay = `${index * 0.1}s`;
            
            const exHtml = day.exercises.map(ex => `
                <div class="split-ex-item">
                    <div class="split-ex-header">
                        <strong>${ex.name}</strong> 
                        <span style="color: ${typeColors[ex.exercise_type] || '#ccc'}; font-size: 0.75rem; border: 1px solid currentColor; padding: 2px 6px; border-radius: 12px; margin-left: auto;">${typeLabels[ex.exercise_type] || "Strength"}</span>
                    </div>
                    <div class="split-ex-meta">
                        ${ex.sets} sets × ${ex.reps} • ${ex.rest_seconds}s rest
                    </div>
                </div>
            `).join("");

            tr.innerHTML = `
                <td class="split-day-cell">
                    <span class="split-day-num">Day ${day.day}</span>
                </td>
                <td class="split-focus-cell">
                    <span class="split-focus-badge">${day.focus}</span>
                    <div class="split-day-kcal">~${day.est_calories} kcal</div>
                </td>
                <td class="split-ex-list">
                    ${exHtml || '<p class="text-muted">Rest Day / Active Recovery</p>'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    results.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ═══════════════════════════════════════════════════════════
// BMI History (Dashboard)
// ═══════════════════════════════════════════════════════════
async function loadBMIHistory() {
    if (!currentUser) return;
    const card = document.getElementById("historyCard");
    card.style.display = "block";

    try {
        const res = await fetch(`${API}/api/bmi_history/${currentUser.id}`);
        const data = await res.json();
        const list = document.getElementById("historyList");

        if (data.history.length === 0) {
            list.innerHTML = '<p class="empty-state">No BMI records yet. Use the calculator to add entries.</p>';
            return;
        }

        list.innerHTML = data.history.map(entry => `
            <div class="history-entry">
                <div class="history-left">
                    <span class="history-bmi cat-${entry.category.toLowerCase()}">${entry.bmi_value}</span>
                    <span class="history-cat">${entry.category}</span>
                </div>
                <div class="history-right">
                    <span class="history-stats">${entry.weight_kg}kg · ${(entry.height_m * 100).toFixed(0)}cm</span>
                    <span class="history-date">${new Date(entry.recorded_at).toLocaleDateString()}</span>
                </div>
            </div>
        `).join("");
    } catch {
        // Silently fail if server is down
    }
}

// ═══════════════════════════════════════════════════════════
// Exercise Library
// ═══════════════════════════════════════════════════════════
function initExerciseLibrary() {
    fetchExercises();
    document.getElementById("filterGoal").addEventListener("change", fetchExercises);
    document.getElementById("filterDifficulty").addEventListener("change", fetchExercises);
}

async function fetchExercises() {
    const goal = document.getElementById("filterGoal").value;
    const difficulty = document.getElementById("filterDifficulty").value;
    const grid = document.getElementById("exerciseLibrary");

    const params = new URLSearchParams();
    if (goal) params.set("goal", goal);
    if (difficulty) params.set("difficulty", difficulty);

    try {
        const res = await fetch(`${API}/api/exercises?${params}`);
        const data = await res.json();

        if (data.exercises.length === 0) {
            grid.innerHTML = '<p class="empty-state">No exercises match your filters.</p>';
            return;
        }

        grid.innerHTML = data.exercises.map((ex, i) => `
            <div class="lib-exercise-card card glass-card" style="animation-delay: ${i * 0.05}s">
                <div class="exercise-img" style="background-image: url('${ex.image_url}')">
                    <span class="difficulty-badge diff-${ex.difficulty}">${ex.difficulty}</span>
                    <span class="goal-badge">${goalEmoji(ex.goal_tag)}</span>
                </div>
                <div class="exercise-body">
                    <h4 class="exercise-name">${ex.name}</h4>
                    <span class="muscle-tag">${ex.muscle_group}</span>
                    <div class="exercise-meta">
                        <div class="meta-item"><span class="meta-label">Sets</span><span class="meta-value">${ex.sets}</span></div>
                        <div class="meta-item"><span class="meta-label">Reps</span><span class="meta-value">${ex.reps}</span></div>
                        <div class="meta-item"><span class="meta-label">Rest</span><span class="meta-value">${ex.rest_seconds}s</span></div>
                    </div>
                    <p class="exercise-instructions">${ex.instructions}</p>
                </div>
            </div>
        `).join("");
    } catch {
        grid.innerHTML = '<p class="empty-state">Unable to load exercises. Is the server running?</p>';
    }
}

function goalEmoji(tag) {
    return { weight_loss: "🔥", muscle_gain: "💪", general_fitness: "🏃", endurance: "❤️", flexibility: "🧘" }[tag] || "🏋️";
}

// ═══════════════════════════════════════════════════════════
// Scroll Animations
// ═══════════════════════════════════════════════════════════
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        entries => entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("animate-in");
                observer.unobserve(e.target);
            }
        }),
        { threshold: 0.1 }
    );
    document.querySelectorAll(".section-header, .card, .filter-bar").forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════════════════════
function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || "ℹ️"}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ═══════════════════════════════════════════════════════════
// Smooth scroll for anchor links
// ═══════════════════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute("href"));
        if (target) target.scrollIntoView({ behavior: "smooth" });
    });
});
