import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useResetPasswordMutation } from "./authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await resetPassword({ token, password }).unwrap();
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err?.data?.message || "Reset link invalid or expired.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-navy-950 p-4">
      <Card hoverable={false} className="w-full max-w-md bg-white dark:bg-navy-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-candy-habits text-white border-2 border-black rounded-2xl flex items-center justify-center shadow-retro-sm">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-navy-900 dark:text-white">
              Password Reset Success!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your password has been updated. Redirecting you to the login screen in a few seconds...
            </p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center gap-2 mb-6 text-center">
              <div className="p-3 bg-brand text-white border-2 border-black rounded-2xl shadow-retro-sm">
                <RefreshCw size={32} />
              </div>
              <h1 className="text-2xl font-heading font-bold text-navy-900 dark:text-white">
                Reset Password
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Set a secure new password for your account
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Match password"
              />

              <Button type="submit" loading={isLoading} className="w-full mt-2">
                Update Password
              </Button>
            </form>

            <div className="mt-6 flex justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 font-heading font-bold text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
              >
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
