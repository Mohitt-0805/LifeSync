/**
 * FitNovaAI — Login Page
 * Multi-step authentication: Email → OTP → Register/Login
 * Tickertape-style passwordless + password login
 */

const API = "";

// ── State ──────────────────────────────────────────────────
let currentEmail = "";
let isNewUser = false;
let hasPassword = false;
let resendTimerInterval = null;
let signupData = { name: "", age: null };  // Persisted across signup flow

// ── DOM Ready ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    // If already logged in, redirect to main app
    const token = localStorage.getItem("fitnovaai_token");
    if (token) {
        checkExistingSession(token);
    }

    initParticles();
    initEmailStep();
    initSignupStep();
    initOTPStep();
    initPasswordLoginStep();
    initRegisterStep();
    initForgotPasswordStep();
    initResetPasswordStep();
    initPasswordToggles();
    initPasswordStrength();
});


// ═══════════════════════════════════════════════════════════
// Session Check
// ═══════════════════════════════════════════════════════════
async function checkExistingSession(token) {
    try {
        const res = await fetch(`${API}/api/auth/me`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
            window.location.href = "/";
            return;
        }
        // Token invalid, clear it
        localStorage.removeItem("fitnovaai_token");
        localStorage.removeItem("fitnovaai_user");
    } catch { /* ignore */ }
}


// ═══════════════════════════════════════════════════════════
// Particles (shared with main app)
// ═══════════════════════════════════════════════════════════
function initParticles() {
    const container = document.getElementById("particles");
    if (!container) return;
    for (let i = 0; i < 35; i++) {
        const p = document.createElement("div");
        p.className = "particle";
        p.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${2 + Math.random() * 3}px;
            height: ${2 + Math.random() * 3}px;
            animation-delay: ${Math.random() * 6}s;
            animation-duration: ${5 + Math.random() * 8}s;
        `;
        container.appendChild(p);
    }
}


// ═══════════════════════════════════════════════════════════
// Step Navigation
// ═══════════════════════════════════════════════════════════
function showStep(stepId) {
    const allSteps = document.querySelectorAll(".login-card");
    allSteps.forEach(step => {
        if (!step.classList.contains("hidden")) {
            step.classList.add("step-exit");
            setTimeout(() => {
                step.classList.add("hidden");
                step.classList.remove("step-exit");
            }, 250);
        }
    });

    setTimeout(() => {
        const target = document.getElementById(stepId);
        target.classList.remove("hidden");
        target.classList.add("step-enter");
        setTimeout(() => target.classList.remove("step-enter"), 400);

        // Focus first input
        const firstInput = target.querySelector("input:not([type='hidden'])");
        if (firstInput) setTimeout(() => firstInput.focus(), 300);
    }, 260);
}


// ═══════════════════════════════════════════════════════════
// Step 1: Email Input
// ═══════════════════════════════════════════════════════════
function initEmailStep() {
    document.getElementById("emailForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        if (!email) return showToast("Please enter your email", "error");

        currentEmail = email;
        const btn = document.getElementById("emailSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, purpose: "login" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");

            isNewUser = data.is_new_user;
            hasPassword = data.has_password;

            // Show OTP step
            document.getElementById("otpEmailDisplay").textContent = email;
            showStep("stepOTP");
            startResendTimer();

            showToast("Verification code sent! Check your email 📧", "success");

            // Dev mode: show OTP on-screen if SMTP not configured
            if (data.dev_otp) {
                setTimeout(() => showToast(`🔐 Dev OTP: ${data.dev_otp}`, "info", 15000), 500);
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    // Show Signup link
    document.getElementById("showSignup").addEventListener("click", () => {
        showStep("stepSignup");
    });
}


// ═══════════════════════════════════════════════════════════
// Sign Up Step
// ═══════════════════════════════════════════════════════════
function initSignupStep() {
    document.getElementById("signupForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("signupName").value.trim();
        const email = document.getElementById("signupEmail").value.trim().toLowerCase();
        const age = parseInt(document.getElementById("signupAge").value);

        if (!name) return showToast("Please enter your name", "error");
        if (!email) return showToast("Please enter your email", "error");
        if (!age || age < 10 || age > 120) return showToast("Please enter a valid age (10-120)", "error");

        // Store signup data for later registration
        signupData = { name, age };
        currentEmail = email;
        isNewUser = true;

        const btn = document.getElementById("signupSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, purpose: "register" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");

            // If user already exists, redirect to login
            if (!data.is_new_user) {
                showToast("An account with this email already exists. Please login.", "info");
                document.getElementById("loginEmail").value = email;
                showStep("stepEmail");
                return;
            }

            hasPassword = false;

            // Show OTP step
            document.getElementById("otpEmailDisplay").textContent = email;
            showStep("stepOTP");
            startResendTimer();

            showToast("Verification code sent! Check your email 📧", "success");

            // Dev mode: show OTP on-screen
            if (data.dev_otp) {
                setTimeout(() => showToast(`🔐 Dev OTP: ${data.dev_otp}`, "info", 15000), 500);
            }
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    // Back button
    document.getElementById("signupBackBtn").addEventListener("click", () => {
        showStep("stepEmail");
    });

    // Switch to login
    document.getElementById("showLoginFromSignup").addEventListener("click", () => {
        showStep("stepEmail");
    });

    // "Login with Password" button
    document.getElementById("showPasswordLogin").addEventListener("click", () => {
        showStep("stepPasswordLogin");
    });
}


// ═══════════════════════════════════════════════════════════
// Step 2: OTP Verification
// ═══════════════════════════════════════════════════════════
function initOTPStep() {
    const inputs = document.querySelectorAll("#otpInputs .otp-digit");
    setupOTPInputs(inputs, "otpInputs");

    document.getElementById("otpForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = getOTPValue("otpInputs");
        if (otp.length !== 6) {
            showOTPError("otpInputs", "Please enter all 6 digits");
            return;
        }

        const btn = document.getElementById("otpSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/verify-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: currentEmail, otp_code: otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                showOTPError("otpInputs", data.error || "Invalid code");
                throw new Error(data.error || "Verification failed");
            }

            if (data.is_new_user) {
                // New user → registration — pre-fill name if from signup
                if (signupData.name) {
                    document.getElementById("regName").value = signupData.name;
                }
                showStep("stepRegister");
                showToast("Email verified! Complete your profile \u2728", "success");
            } else {
                // Existing user → logged in
                localStorage.setItem("fitnovaai_token", data.token);
                localStorage.setItem("fitnovaai_user", JSON.stringify(data.user));
                showToast(data.message || "Welcome back! 🎉", "success");
                setTimeout(() => window.location.href = "/", 1000);
            }
        } catch (err) {
            if (!err.message.includes("Invalid")) {
                showToast(err.message, "error");
            }
        } finally {
            btn.classList.remove("loading");
        }
    });

    // Back button
    document.getElementById("otpBackBtn").addEventListener("click", () => {
        clearResendTimer();
        showStep("stepEmail");
    });

    // Resend button
    document.getElementById("resendBtn").addEventListener("click", async () => {
        const btn = document.getElementById("resendBtn");
        btn.disabled = true;
        btn.textContent = "Sending...";

        try {
            const res = await fetch(`${API}/api/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: currentEmail, purpose: "login" }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            showToast("New code sent! Check your email 📧", "success");
            startResendTimer();
            clearOTPInputs("otpInputs");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Resend Code";
        }
    });
}


// ═══════════════════════════════════════════════════════════
// Step 3a: Password Login
// ═══════════════════════════════════════════════════════════
function initPasswordLoginStep() {
    document.getElementById("passwordLoginForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("pwLoginEmail").value.trim().toLowerCase();
        const password = document.getElementById("pwLoginPassword").value;

        if (!email || !password) return showToast("Please fill all fields", "error");

        const btn = document.getElementById("pwLoginSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/login-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Login failed");

            localStorage.setItem("fitnovaai_token", data.token);
            localStorage.setItem("fitnovaai_user", JSON.stringify(data.user));
            showToast(data.message || "Welcome back! 🎉", "success");
            setTimeout(() => window.location.href = "/", 1000);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    document.getElementById("pwLoginBackBtn").addEventListener("click", () => {
        showStep("stepEmail");
    });

    document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
        const email = document.getElementById("pwLoginEmail").value.trim();
        if (email) document.getElementById("forgotEmail").value = email;
        showStep("stepForgotPassword");
    });
}


// ═══════════════════════════════════════════════════════════
// Step 3b: Registration
// ═══════════════════════════════════════════════════════════
function initRegisterStep() {
    document.getElementById("registerForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("regName").value.trim();
        const password = document.getElementById("regPassword").value;
        const confirm = document.getElementById("regConfirmPassword").value;

        if (!name) return showToast("Please enter your name", "error");
        if (!password) return showToast("Please create a password", "error");
        if (password !== confirm) return showToast("Passwords don't match", "error");

        const btn = document.getElementById("regSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: currentEmail,
                    name: signupData.name || name,
                    password,
                    age: signupData.age || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Registration failed");

            localStorage.setItem("fitnovaai_token", data.token);
            localStorage.setItem("fitnovaai_user", JSON.stringify(data.user));
            showToast(data.message || "Account created! 🎉", "success");
            setTimeout(() => window.location.href = "/", 1000);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    document.getElementById("regBackBtn").addEventListener("click", () => {
        showStep("stepEmail");
    });
}


// ═══════════════════════════════════════════════════════════
// Step 4: Forgot Password
// ═══════════════════════════════════════════════════════════
function initForgotPasswordStep() {
    document.getElementById("forgotPasswordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("forgotEmail").value.trim().toLowerCase();
        if (!email) return showToast("Please enter your email", "error");

        currentEmail = email;
        const btn = document.getElementById("forgotSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");

            showToast("Reset code sent! Check your email 📧", "success");

            // Dev mode: show OTP on-screen
            if (data.dev_otp) {
                setTimeout(() => showToast(`🔐 Dev OTP: ${data.dev_otp}`, "info", 15000), 500);
            }
            showStep("stepResetPassword");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    document.getElementById("forgotBackBtn").addEventListener("click", () => {
        showStep("stepPasswordLogin");
    });
}


// ═══════════════════════════════════════════════════════════
// Step 5: Reset Password
// ═══════════════════════════════════════════════════════════
function initResetPasswordStep() {
    const inputs = document.querySelectorAll("#resetOtpInputs .otp-digit");
    setupOTPInputs(inputs, "resetOtpInputs");

    document.getElementById("resetPasswordForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const otp = getOTPValue("resetOtpInputs");
        const newPassword = document.getElementById("resetNewPassword").value;
        const confirm = document.getElementById("resetConfirmPassword").value;

        if (otp.length !== 6) return showToast("Please enter the 6-digit code", "error");
        if (!newPassword) return showToast("Please enter a new password", "error");
        if (newPassword !== confirm) return showToast("Passwords don't match", "error");

        const btn = document.getElementById("resetSubmitBtn");
        btn.classList.add("loading");

        try {
            const res = await fetch(`${API}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: currentEmail,
                    otp_code: otp,
                    new_password: newPassword,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Reset failed");

            showToast("Password reset successfully! 🎉", "success");

            document.getElementById("successTitle").textContent = "Password Reset!";
            document.getElementById("successSubtitle").textContent = "Your password has been successfully updated.";
            showStep("stepSuccess");
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            btn.classList.remove("loading");
        }
    });

    document.getElementById("resetBackBtn").addEventListener("click", () => {
        showStep("stepForgotPassword");
    });
}


// ═══════════════════════════════════════════════════════════
// OTP Input Helpers
// ═══════════════════════════════════════════════════════════
function setupOTPInputs(inputs, containerId) {
    inputs.forEach((input, idx) => {
        // Auto-advance on input
        input.addEventListener("input", (e) => {
            const val = e.target.value.replace(/\D/g, "");
            e.target.value = val.charAt(0) || "";

            if (val && idx < inputs.length - 1) {
                inputs[idx + 1].focus();
            }

            // Update filled state
            input.classList.toggle("filled", !!val);
            input.classList.remove("error");

            // Auto-submit when all filled
            if (val && idx === inputs.length - 1) {
                const otp = getOTPValue(containerId);
                if (otp.length === 6) {
                    const form = input.closest("form");
                    if (form) form.dispatchEvent(new Event("submit", { cancelable: true }));
                }
            }
        });

        // Handle backspace
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !input.value && idx > 0) {
                inputs[idx - 1].focus();
                inputs[idx - 1].value = "";
                inputs[idx - 1].classList.remove("filled");
            }
            // Arrow key navigation
            if (e.key === "ArrowLeft" && idx > 0) {
                e.preventDefault();
                inputs[idx - 1].focus();
            }
            if (e.key === "ArrowRight" && idx < inputs.length - 1) {
                e.preventDefault();
                inputs[idx + 1].focus();
            }
        });

        // Select on focus
        input.addEventListener("focus", () => {
            input.select();
        });

        // Handle paste
        input.addEventListener("paste", (e) => {
            e.preventDefault();
            const pasted = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
            pasted.split("").forEach((char, i) => {
                if (inputs[i]) {
                    inputs[i].value = char;
                    inputs[i].classList.add("filled");
                }
            });
            if (pasted.length > 0) {
                const focusIdx = Math.min(pasted.length, inputs.length - 1);
                inputs[focusIdx].focus();
            }
            if (pasted.length === 6) {
                const form = input.closest("form");
                if (form) setTimeout(() => form.dispatchEvent(new Event("submit", { cancelable: true })), 200);
            }
        });
    });
}

function getOTPValue(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} .otp-digit`);
    return Array.from(inputs).map(i => i.value).join("");
}

function clearOTPInputs(containerId) {
    const inputs = document.querySelectorAll(`#${containerId} .otp-digit`);
    inputs.forEach(i => {
        i.value = "";
        i.classList.remove("filled", "error");
    });
    if (inputs[0]) inputs[0].focus();
}

function showOTPError(containerId, message) {
    const inputs = document.querySelectorAll(`#${containerId} .otp-digit`);
    inputs.forEach(i => i.classList.add("error"));
    setTimeout(() => inputs.forEach(i => i.classList.remove("error")), 1500);

    const errorEl = document.getElementById("otpError");
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove("hidden");
        setTimeout(() => errorEl.classList.add("hidden"), 4000);
    }
}


// ═══════════════════════════════════════════════════════════
// Resend Timer
// ═══════════════════════════════════════════════════════════
function startResendTimer() {
    clearResendTimer();
    let seconds = 60;
    const timerEl = document.getElementById("resendTimer");
    const textEl = document.getElementById("resendText");
    const btnEl = document.getElementById("resendBtn");

    textEl.classList.remove("hidden");
    btnEl.classList.add("hidden");
    timerEl.textContent = seconds;

    resendTimerInterval = setInterval(() => {
        seconds--;
        timerEl.textContent = seconds;
        if (seconds <= 0) {
            clearResendTimer();
            textEl.classList.add("hidden");
            btnEl.classList.remove("hidden");
        }
    }, 1000);
}

function clearResendTimer() {
    if (resendTimerInterval) {
        clearInterval(resendTimerInterval);
        resendTimerInterval = null;
    }
}


// ═══════════════════════════════════════════════════════════
// Password Toggles
// ═══════════════════════════════════════════════════════════
function initPasswordToggles() {
    const toggles = [
        { btn: "pwLoginToggle", input: "pwLoginPassword" },
        { btn: "regPwToggle", input: "regPassword" },
        { btn: "resetPwToggle", input: "resetNewPassword" },
    ];

    toggles.forEach(({ btn, input }) => {
        const toggleBtn = document.getElementById(btn);
        const inputEl = document.getElementById(input);
        if (!toggleBtn || !inputEl) return;

        toggleBtn.addEventListener("click", () => {
            const isPassword = inputEl.type === "password";
            inputEl.type = isPassword ? "text" : "password";
            toggleBtn.querySelector(".eye-open").classList.toggle("hidden", !isPassword);
            toggleBtn.querySelector(".eye-closed").classList.toggle("hidden", isPassword);
        });
    });
}


// ═══════════════════════════════════════════════════════════
// Password Strength
// ═══════════════════════════════════════════════════════════
function initPasswordStrength() {
    const configs = [
        { input: "regPassword", barsContainer: "regStrength", label: "regStrengthLabel" },
        { input: "resetNewPassword", barsContainer: "resetStrength", label: "resetStrengthLabel" },
    ];

    configs.forEach(({ input, barsContainer, label }) => {
        const inputEl = document.getElementById(input);
        if (!inputEl) return;

        inputEl.addEventListener("input", () => {
            const pw = inputEl.value;
            const strength = getPasswordStrength(pw);
            updateStrengthUI(barsContainer, label, strength);
        });
    });
}

function getPasswordStrength(pw) {
    if (!pw) return { score: 0, label: "", color: "" };

    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "danger" };
    if (score <= 2) return { score: 2, label: "Fair", color: "warning" };
    if (score <= 3) return { score: 3, label: "Good", color: "medium" };
    return { score: 4, label: "Strong", color: "strong" };
}

function updateStrengthUI(containerId, labelId, strength) {
    const container = document.getElementById(containerId);
    const label = document.getElementById(labelId);
    if (!container || !label) return;

    const bars = container.querySelectorAll(".strength-bar");
    bars.forEach((bar, i) => {
        bar.classList.remove("active", "medium", "strong");
        if (i < strength.score) {
            bar.classList.add("active");
            if (strength.color === "medium") bar.classList.add("medium");
            if (strength.color === "strong") bar.classList.add("strong");
        }
    });

    label.textContent = strength.label;
    const colors = { danger: "#ff5252", warning: "#ffab40", medium: "#36b5f4", strong: "#00e676" };
    label.style.color = colors[strength.color] || "var(--text-muted)";
}


// ═══════════════════════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════════════════════
function showToast(message, type = "info", duration = 4000) {
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
    }, duration);
}
