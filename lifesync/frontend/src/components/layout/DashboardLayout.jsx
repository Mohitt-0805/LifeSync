import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, logout } from "../../features/auth/authSlice";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useTheme } from "../../context/ThemeContext";
import { ProgressBar } from "../ui/ProgressBar";
import { Button } from "../ui/Button";
import CommandPalette from "./CommandPalette";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Flame,
  Wallet,
  FileText,
  Calendar,
  GraduationCap,
  User,
  LogOut,
  Sun,
  Moon,
  Search,
  Bell,
  Menu,
  X,
  Trophy,
} from "lucide-react";

export default function DashboardLayout() {
  const user = useSelector(selectCurrentUser);
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [triggerLogout] = useLogoutMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await triggerLogout().unwrap();
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      dispatch(logout());
      navigate("/login");
    }
  };

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard, color: "hover:bg-cream-dark dark:hover:bg-navy-800" },
    { name: "Tasks", path: "/tasks", icon: CheckSquare, color: "hover:bg-candy-tasks/20 text-candy-tasks" },
    { name: "Goals", path: "/goals", icon: Target, color: "hover:bg-candy-goals/20 text-candy-goals" },
    { name: "Habits", path: "/habits", icon: Flame, color: "hover:bg-candy-habits/20 text-candy-habits" },
    { name: "Expenses", path: "/expenses", icon: Wallet, color: "hover:bg-candy-expenses/20 text-candy-expenses" },
    { name: "Notes", path: "/notes", icon: FileText, color: "hover:bg-candy-notes/20 text-candy-notes" },
    { name: "Calendar", path: "/calendar", icon: Calendar, color: "hover:bg-candy-calendar/20 text-candy-calendar" },
    { name: "Timetable", path: "/timetable", icon: GraduationCap, color: "hover:bg-blue-100/60 text-blue-600" },
    { name: "Learn", path: "/learn", icon: GraduationCap, color: "hover:bg-emerald-100/60 text-emerald-600" },
  ];

  // Calculate XP percentage
  const nextLevelXp = (user?.level || 1) * 200;
  const xpPercentage = Math.round(((user?.xp || 0) / nextLevelXp) * 100);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-cream dark:bg-navy-950 text-navy-900 dark:text-white">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-navy-900 border-r-4 border-black dark:border-white p-6 shrink-0 z-20">
        <Link to="/" className="flex items-center gap-2 mb-8 select-none">
          <div className="p-2 bg-brand text-white border-2 border-black rounded-xl shadow-retro-sm">
            <Trophy size={20} />
          </div>
          <span className="font-heading font-bold text-2xl tracking-tight">
            Life<span className="text-brand">Sync</span>
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-heading font-bold border-2 rounded-2xl transition-all spring-transition active-press ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-retro-sm"
                    : `bg-transparent border-transparent text-navy-800 dark:text-gray-300 ${item.color}`
                }`
              }
            >
              <item.icon size={20} className="shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Lower Links / Profile */}
        <div className="border-t-2 border-black dark:border-white pt-6 mt-6 space-y-4">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 font-heading font-bold border-2 rounded-2xl transition-all spring-transition active-press ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-retro-sm"
                  : "bg-transparent border-transparent text-navy-800 dark:text-gray-300 hover:bg-cream-dark dark:hover:bg-navy-800"
              }`
            }
          >
            <User size={20} className="shrink-0" />
            <span>Settings</span>
          </NavLink>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 font-heading font-bold"
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between bg-white dark:bg-navy-900 border-b-4 border-black dark:border-white p-4 z-20">
        <Link to="/" className="flex items-center gap-1.5 font-heading font-bold text-xl">
          <Trophy size={18} className="text-brand" />
          <span>Life<span className="text-brand">Sync</span></span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Level Tracker Mobile */}
          <div className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 border-2 border-black rounded-full px-2 py-0.5 text-xs font-heading font-bold">
            <span className="text-yellow-600">Lvl</span>
            <span>{user?.level || 1}</span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 border-2 border-black dark:border-white rounded-xl bg-cream-dark dark:bg-navy-800"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[60px] bg-cream dark:bg-navy-950 z-30 flex flex-col p-6 space-y-4 border-t-2 border-black">
          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 font-heading font-bold border-2 rounded-2xl ${
                    isActive
                      ? "bg-black text-white dark:bg-white dark:text-black border-black"
                      : "bg-white border-black text-navy-800 dark:bg-navy-900 dark:text-gray-300"
                  }`
                }
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            ))}
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 font-heading font-bold border-2 rounded-2xl ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black border-black"
                    : "bg-white border-black text-navy-800 dark:bg-navy-900 dark:text-gray-300"
                }`
              }
            >
              <User size={20} />
              <span>Settings</span>
            </NavLink>
          </nav>

          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut size={16} /> Logout
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - Desktop View */}
        <header className="hidden md:flex items-center justify-between bg-white dark:bg-navy-900 border-b-4 border-black dark:border-white px-8 py-4 shrink-0 z-10">
          {/* XP & Level Tracker - Top Header */}
          <div className="flex items-center gap-3 bg-white dark:bg-navy-900 border-2 border-black dark:border-white rounded-2xl p-2 px-3.5 shadow-retro-sm w-80">
            <div className="flex items-center justify-center w-9 h-9 bg-yellow-300 border-2 border-black rounded-xl text-black font-heading font-bold text-base shrink-0">
              {user?.level || 1}
            </div>
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center justify-between text-[10px] font-heading font-bold mb-1">
                <span className="text-gray-500 dark:text-gray-400">LEVEL XP</span>
                <span className="text-navy-800 dark:text-gray-200">
                  {user?.xp || 0}/{nextLevelXp} ({xpPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-navy-950 rounded-full h-2 border border-black overflow-hidden">
                <div
                  className="h-full bg-[#8b5cf6] transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, xpPercentage))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Header Operations */}
          <div className="flex items-center gap-4">
            {/* Search Launcher */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-global-search"))}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black dark:border-white rounded-2xl hover:bg-cream-dark dark:hover:bg-navy-800 text-gray-500 dark:text-gray-300 transition-colors font-heading text-sm font-bold active-press"
            >
              <Search size={16} />
              <span>Search</span>
            </button>

            {/* Notification Bell */}
            <button className="p-2.5 border-2 border-black dark:border-white rounded-2xl hover:bg-cream-dark dark:hover:bg-navy-800 transition-colors relative active-press">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full border border-black" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 border-2 border-black dark:border-white rounded-2xl hover:bg-cream-dark dark:hover:bg-navy-800 transition-colors active-press"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User Avatar */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 pl-3 border-l-2 border-gray-300 dark:border-navy-700"
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.name || "LifeSync"}`
                }
                alt="Avatar"
                className="w-10 h-10 border-2 border-black dark:border-white rounded-xl shadow-retro-sm bg-brand/10 shrink-0"
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-heading font-bold text-sm leading-none mb-0.5">
                  {user?.name}
                </span>
                <span className="text-xs text-gray-500 leading-none">
                  Active Member
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-cream dark:bg-navy-950">
          <Outlet />
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
