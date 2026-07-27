import React, { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, selectCurrentUser, setCredentials, logout } from "./authSlice";
import { useGetProfileQuery } from "./authApi";

export default function ProtectedRoute() {
  const token = useSelector(selectCurrentToken);
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch();

  // If token exists but user details aren't in Redux state yet, fetch them
  const { data: profileRes, error, isLoading } = useGetProfileQuery(undefined, {
    skip: !token || !!user,
  });

  useEffect(() => {
    if (profileRes && profileRes.success) {
      dispatch(setCredentials({ user: profileRes.data, token }));
    }
  }, [profileRes, token, dispatch]);

  useEffect(() => {
    if (error) {
      dispatch(logout());
    }
  }, [error, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading || (!user && token)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream dark:bg-navy-950">
        <div className="animate-bounce p-4 bg-brand border-4 border-black dark:border-white rounded-3xl shadow-retro">
          <span className="font-heading font-bold text-xl text-white">Syncing Life Dashboard...</span>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
