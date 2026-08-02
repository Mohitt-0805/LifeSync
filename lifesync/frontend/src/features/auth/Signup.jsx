import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterMutation } from "./authApi";
import { setCredentials, selectCurrentToken } from "./authSlice";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { UserPlus, Sparkles } from "lucide-react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const [register, { isLoading }] = useRegisterMutation();
  const token = useSelector(selectCurrentToken);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Persistent Login: Redirect to dashboard if already logged in
  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters long";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const res = await register({ name, email, password }).unwrap();
      if (res.data?.requiresOtp) {
        navigate(`/verify-otp?email=${encodeURIComponent(res.data.email || email)}`, {
          state: { email: res.data.email || email, emailWarning: res.data.emailWarning },
        });
      } else if (res.data?.user && res.data?.accessToken) {
        dispatch(setCredentials({ user: res.data.user, token: res.data.accessToken }));
        navigate("/");
      } else {
        navigate(`/verify-otp?email=${encodeURIComponent(email)}`, {
          state: { email, emailWarning: res.data?.emailWarning },
        });
      }
    } catch (err) {
      console.error(err);
      const backendMessage = err?.data?.message || "Registration failed. Try a different email.";
      setErrors({ global: backendMessage });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-navy-950 p-4">
      <Card hoverable={false} className="w-full max-w-md bg-white dark:bg-navy-900 border-4 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)]">
        <div className="flex flex-col items-center gap-2 mb-6 text-center">
          <div className="p-3 bg-brand text-white border-2 border-black rounded-2xl shadow-retro-sm">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-heading font-bold text-navy-900 dark:text-white">
            Join <span className="text-brand">LifeSync</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Level up your life, gamify goals, and gain XP
          </p>
        </div>

        {errors.global && (
          <div className="p-3 mb-4 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
            {errors.global}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            error={errors.name}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@example.com"
            error={errors.email}
          />

          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            error={errors.password}
          />

          <Button type="submit" loading={isLoading} className="w-full mt-2">
            <UserPlus size={18} />
            Sign Up
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-heading font-bold text-brand hover:underline"
          >
            Log In
          </Link>
        </p>
      </Card>
    </div>
  );
}
