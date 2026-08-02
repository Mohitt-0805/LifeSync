import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "./authApi";
import { setCredentials, selectCurrentToken } from "./authSlice";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { ShieldCheck, LogIn } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();

  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Persistent Login: Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ user: res.data.user, token: res.data.accessToken }));
      navigate("/");
    } catch (err) {
      console.error(err);
      const backendMessage = err?.data?.message || "Login failed. Please check your credentials.";
      setErrors({ global: backendMessage });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-navy-950 p-4">
      <Card hoverable={false} className="w-full max-w-md bg-white dark:bg-navy-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="p-3 bg-brand text-white border-2 border-black rounded-2xl shadow-retro-sm">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white">
            Welcome back to <span className="text-brand">LifeSync</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Sync your tasks, habits, and life achievements
          </p>
        </div>

        {errors.global && (
          <div className="p-3 mb-4 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
            {errors.global}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            error={errors.password}
          />

          <div className="flex justify-end text-sm">
            <Link
              to="/forgot-password"
              className="font-heading font-bold text-brand hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          <Button type="submit" loading={isLoginLoading} className="w-full">
            <LogIn size={18} />
            Log In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-heading font-bold text-brand hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </Card>
    </div>
  );
}
