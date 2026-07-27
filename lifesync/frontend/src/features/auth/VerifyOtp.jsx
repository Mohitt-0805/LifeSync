import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useVerifyOtpMutation, useResendOtpMutation } from "./authApi";
import { setCredentials } from "./authSlice";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { KeyRound, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const initialEmail = location.state?.email || new URLSearchParams(location.search).get("email") || "";
  const [email] = useState(initialEmail);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Resend timer countdown
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleChange = (index, value) => {
    if (/[^0-9]/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteData)) {
      const digits = pasteData.split("");
      setOtp(digits);
      inputRefs.current[5].focus();
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP code");
      return;
    }

    if (!email) {
      setError("Email address is missing. Please go back to Signup/Login.");
      return;
    }

    try {
      const res = await verifyOtp({ email, otp: fullOtp }).unwrap();
      setSuccessMsg("OTP Verified! Redirecting...");
      dispatch(setCredentials({ user: res.data.user, token: res.data.accessToken }));
      setTimeout(() => {
        navigate("/");
      }, 800);
    } catch (err) {
      console.error("OTP verification error", err);
      setError(err?.data?.message || "Invalid or expired OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setError("");
    setSuccessMsg("");

    try {
      await resendOtp({ email, purpose: "Verification" }).unwrap();
      setSuccessMsg("A fresh 6-digit OTP has been sent to your email!");
      setTimer(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } catch (err) {
      setError(err?.data?.message || "Failed to resend OTP. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-navy-950 p-4">
      <Card
        hoverable={false}
        className="w-full max-w-md bg-white dark:bg-navy-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]"
      >
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="p-3 bg-brand text-white border-2 border-black rounded-2xl shadow-retro-sm">
            <KeyRound size={32} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white">
            Verify <span className="text-brand">OTP</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            We sent a 6-digit verification code to:
          </p>
          <p className="font-heading font-bold text-navy-900 dark:text-white text-base bg-indigo-50 dark:bg-navy-800 px-3 py-1 rounded-xl border border-indigo-200 dark:border-navy-700">
            {email || "your email"}
          </p>
        </div>

        {error && (
          <div className="p-3 mb-4 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 mb-4 bg-green-100 border-2 border-black text-green-700 rounded-xl font-heading text-sm font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold font-mono border-3 border-black dark:border-white rounded-xl bg-white dark:bg-navy-950 text-navy-900 dark:text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] dark:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] focus:outline-none focus:ring-2 focus:ring-brand"
              />
            ))}
          </div>

          <Button type="submit" loading={isVerifying} className="w-full text-lg py-3">
            Verify & Continue
          </Button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Didn't receive the code?</span>
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="font-heading font-bold text-brand hover:underline flex items-center gap-1"
              >
                <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
                Resend OTP
              </button>
            ) : (
              <span className="font-mono font-bold text-navy-900 dark:text-white bg-gray-100 dark:bg-navy-800 px-2 py-0.5 rounded border border-gray-300 dark:border-navy-700">
                Resend in {timer}s
              </span>
            )}
          </div>

          <Link
            to="/signup"
            className="flex items-center gap-1 font-heading text-xs font-semibold text-gray-500 hover:text-navy-900 dark:hover:text-white mt-2"
          >
            <ArrowLeft size={14} /> Back to Signup
          </Link>
        </div>
      </Card>
    </div>
  );
}
