import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, updateUser } from "./authSlice";
import { useUpdateProfileMutation } from "./authApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import {
  User,
  Award,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Phone,
  MessageSquare,
  CheckCircle,
  Bell,
} from "lucide-react";

export default function ProfileSettings() {
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  const [name, setName] = useState(user?.name || "");
  const [avatarSeed, setAvatarSeed] = useState(
    user?.avatar?.includes("seed=")
      ? user.avatar.split("seed=")[1]
      : Math.random().toString(36).substring(7)
  );

  // WhatsApp states
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [whatsappOptIn, setWhatsappOptIn] = useState(user?.whatsappOptIn ?? false);
  const [whatsappVerified, setWhatsappVerified] = useState(user?.whatsappVerified ?? false);
  const [whatsappPreferences, setWhatsappPreferences] = useState({
    tasks: user?.whatsappPreferences?.tasks ?? true,
    goals: user?.whatsappPreferences?.goals ?? true,
    events: user?.whatsappPreferences?.events ?? true,
    memberships: user?.whatsappPreferences?.memberships ?? true,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Generate dynamic pixel-art avatar URL
  const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${avatarSeed}`;

  const handleRandomizeAvatar = () => {
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const handlePrefChange = (key, val) => {
    setWhatsappPreferences((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    try {
      const res = await updateProfile({
        name,
        avatar: avatarUrl,
        phoneNumber,
        whatsappOptIn,
        whatsappVerified,
        whatsappPreferences,
      }).unwrap();

      dispatch(updateUser(res.data));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError(err?.data?.message || "Failed to update profile settings.");
    }
  };

  const nextLevelXp = (user?.level || 1) * 200;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-heading font-bold">Profile Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account identity, gamified stats, and WhatsApp deadline reminders
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: Avatar Panel */}
        <Card hoverable={false} className="flex flex-col items-center text-center justify-between p-6">
          <div className="space-y-4 w-full">
            <h2 className="text-xl font-heading font-bold border-b-2 border-black dark:border-white pb-2 mb-4">
              Your Avatar
            </h2>
            <div className="relative group mx-auto w-32 h-32">
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-full h-full border-4 border-black dark:border-white rounded-3xl shadow-retro bg-brand/5 object-cover"
              />
              <button
                type="button"
                onClick={handleRandomizeAvatar}
                className="absolute -bottom-2 -right-2 p-2 bg-yellow-300 border-2 border-black rounded-xl shadow-retro-sm hover:scale-105 active:scale-95 transition-transform"
                title="Randomize avatar seed"
              >
                <RefreshCw size={16} className="text-black" />
              </button>
            </div>
            <div className="pt-2">
              <Input
                label="Avatar Seed String"
                value={avatarSeed}
                onChange={(e) => setAvatarSeed(e.target.value)}
                placeholder="Type to customize avatar"
              />
              <p className="text-xs text-gray-400 mt-1">
                Type any text above to generate a unique pixel-art avatar!
              </p>
            </div>
          </div>
        </Card>

        {/* Center/Right: Profile & Notification Preferences */}
        <Card hoverable={false} className="md:col-span-2 p-6 flex flex-col justify-between">
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="text-xl font-heading font-bold border-b-2 border-black dark:border-white pb-2">
              Identity Details
            </h2>

            {error && (
              <div className="p-3 bg-red-100 border-2 border-black text-red-700 rounded-xl font-heading text-sm font-bold text-center">
                <ShieldAlert className="inline-block mr-2" size={16} />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-candy-habits/20 border-2 border-candy-habits text-emerald-700 dark:text-emerald-400 rounded-xl font-heading text-sm font-bold text-center">
                <Sparkles className="inline-block mr-2" size={16} />
                Profile updated successfully!
              </div>
            )}

            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />

              <Input
                label="Email Address (read-only)"
                value={user?.email || ""}
                disabled
                className="opacity-75"
              />
            </div>

            {/* WhatsApp Reminder Settings Section */}
            <div className="pt-4 border-t-2 border-black dark:border-white space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-emerald-500" size={20} />
                <h3 className="text-lg font-heading font-bold">
                  WhatsApp Deadline Reminders
                </h3>
              </div>

              <Input
                label="WhatsApp Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="flex items-center gap-3 p-3 border-2 border-black dark:border-white rounded-xl cursor-pointer hover:bg-cream dark:hover:bg-navy-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={whatsappOptIn}
                    onChange={(e) => setWhatsappOptIn(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded border-2 border-black"
                  />
                  <span className="font-heading font-bold text-sm">
                    Opt-In to WhatsApp Reminders
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 border-2 border-black dark:border-white rounded-xl cursor-pointer hover:bg-cream dark:hover:bg-navy-800 transition-colors">
                  <input
                    type="checkbox"
                    checked={whatsappVerified}
                    onChange={(e) => setWhatsappVerified(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded border-2 border-black"
                  />
                  <span className="font-heading font-bold text-sm flex items-center gap-1">
                    Number Verified
                    {whatsappVerified && <CheckCircle size={14} className="text-emerald-500" />}
                  </span>
                </label>
              </div>

              {/* Per-type Preferences Toggles */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-heading font-bold text-gray-500 uppercase tracking-wide">
                  Reminder Type Preferences (1 day before deadline)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: "tasks", label: "Tasks" },
                    { key: "goals", label: "Goals" },
                    { key: "events", label: "Events" },
                    { key: "memberships", label: "Memberships" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center justify-between p-2.5 border-2 rounded-xl cursor-pointer text-xs font-heading font-bold transition-all ${
                        whatsappPreferences[key]
                          ? "border-black dark:border-white bg-emerald-100 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300"
                          : "border-gray-300 dark:border-navy-700 bg-gray-50 dark:bg-navy-900 text-gray-400"
                      }`}
                    >
                      <span>{label}</span>
                      <input
                        type="checkbox"
                        checked={!!whatsappPreferences[key]}
                        onChange={(e) => handlePrefChange(key, e.target.checked)}
                        className="w-3.5 h-3.5 accent-emerald-500 rounded"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button type="submit" loading={isLoading} className="w-full md:w-auto px-8">
              Save Changes
            </Button>
          </form>
        </Card>
      </div>

      {/* Level stats panel */}
      <Card hoverable={false} className="p-6">
        <h2 className="text-xl font-heading font-bold border-b-2 border-black dark:border-white pb-2 mb-6">
          LifeSync Player Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="border-2 border-black dark:border-white rounded-2xl p-4 bg-yellow-100/50 dark:bg-yellow-900/10">
            <Award className="mx-auto text-yellow-500 mb-1" size={24} />
            <div className="text-sm text-gray-500 font-heading font-bold">CURRENT LEVEL</div>
            <div className="text-3xl font-heading font-bold text-black dark:text-white mt-1">
              Level {user?.level || 1}
            </div>
          </div>

          <div className="border-2 border-black dark:border-white rounded-2xl p-4 bg-orange-100/50 dark:bg-brand/10">
            <Sparkles className="mx-auto text-brand mb-1" size={24} />
            <div className="text-sm text-gray-500 font-heading font-bold font-heading">TOTAL EXPERIENCE</div>
            <div className="text-3xl font-heading font-bold text-black dark:text-white mt-1">
              {user?.xp || 0} XP
            </div>
          </div>

          <div className="border-2 border-black dark:border-white rounded-2xl p-4 bg-violet-100/50 dark:bg-candy-goals/10">
            <User className="mx-auto text-candy-goals mb-1" size={24} />
            <div className="text-sm text-gray-500 font-heading font-bold">NEXT LEVEL AT</div>
            <div className="text-3xl font-heading font-bold text-black dark:text-white mt-1">
              {nextLevelXp} XP
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {nextLevelXp - (user?.xp || 0)} XP remaining
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
