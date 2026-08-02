import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./features/auth/Login";
import Signup from "./features/auth/Signup";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

// Placeholder stubs that we will build out module by module
import Dashboard from "./features/dashboard/Dashboard";
import Tasks from "./features/tasks/Tasks";
import Goals from "./features/goals/Goals";
import Habits from "./features/habits/Habits";
import Expenses from "./features/expenses/Expenses";
import Notes from "./features/notes/Notes";
import CalendarView from "./features/calendar/CalendarView";
import ProfileSettings from "./features/auth/ProfileSettings";
import LearnHome from "./features/learn/LearnHome";
import CourseView from "./features/learn/CourseView";
import LessonView from "./features/learn/LessonView";

import Timetable from "./features/timetable/Timetable";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/learn" element={<LearnHome />} />
            <Route path="/learn/:courseId" element={<CourseView />} />
            <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonView />} />
            <Route path="/profile" element={<ProfileSettings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
