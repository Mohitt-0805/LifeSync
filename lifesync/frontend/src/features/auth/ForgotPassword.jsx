import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "./authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { KeyRound, ArrowLeft, MailCheck, AlertTriangle } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Email address is required");
      return;
    }

    try {
      const res = await forgotPassword({ email }).unwrap();
      setSuccess(true);
      if (res.data?.emailWarning) {
        setEmailWarning(res.data.emailWarning);
      }
    } catch (err) {
      console.error(err);
      setError(err?.data?.message || "Something went wrong. Please verify the email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-navy-950 p-4">
      <Card hoverable={false} className="w-full max-w-md bg-white dark:bg-navy-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        {success ? (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-candy-habits text-white border-2 border-black rounded-2xl flex items-center justify-center shadow-retro-sm animate-bounce">
              <MailCheck size={32} />
            </div>
            <h1 className="text-2xl font-heading font-bold text-navy-900 dark:text-white">
              Check Your Inbox
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              If an account exists for <span className="font-bold text-black dark:text-white">{email}</span>, we have dispatched a password reset link.
            </p>
            <div className="p-3 bg-yellow-50 border-2 border-dashed border-yellow-500 text-yellow-800 rounded-xl text-xs font-heading font-bold">
              Tip: For local development, check the backend console log for the reset link!
            </div>
            {emailWarning && (
              <div className="p-3 bg-amber-50 border-2 border-amber-400 text-amber-800 rounded-xl font-heading text-sm font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle size={16} className="flex-shrink-0" />
                <span>{emailWarning}</span>
              </div>
            )}
            <div className="pt-2">
              <Link to="/login">
                <Button variant="secondary" className="w-full">
                  <ArrowLeft size={16} /> Return to Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col items-center gap-2 mb-6 text-center">
              <div className="p-3 bg-brand text-white border-2 border-black rounded-2xl shadow-retro-sm">
                <KeyRound size={32} />
              </div>
              <h1 className="text-2xl font-heading font-bold text-navy-900 dark:text-white">
                Forgot Password?
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enter your email address to recover your account credentials
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                error={error}
              />

              <Button type="submit" loading={isLoading} className="w-full mt-2">
                Send Reset Link
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
