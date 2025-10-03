import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../lib/auth";

export default function ProtectedRoute({ children, requireAdmin = false, requireEmployee = false }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.isAuthenticated()) {
        setChecking(false);
        return;
      }

      try {
        const userData = await auth.getMe();
        setUser(userData);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  if (requireEmployee && user.role !== "employee" && user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
