import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Index.jsx";
import Shareholders from "./pages/Shareholders.jsx";
import DmatAccounts from "./pages/DmatAccounts.jsx";
import ClientProfiles from "./pages/ClientProfiles.jsx";
import ClientProfileDetails from "./pages/ClientProfileDetails.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import NotFound from "./pages/NotFound.jsx";
import { auth } from "./lib/auth.js";
import Navbar from "./components/Navbar.jsx";

/* Theme toggle is provided by components/ThemeToggle.jsx */
function ThemeToggle_REMOVED_DO_NOT_USE() {
  const [theme, setTheme] = useState(
    typeof window !== "undefined" ? localStorage.getItem("theme") || "light" : "light",
  );
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);
  return (
    <button
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      className="px-3 py-1.5 rounded border text-xs"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "Light" : "Dark"}
    </button>
  );
}

function Layout({ children }) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    try {
      const u = auth.getUser?.() || null;
      setUser(u);
    } catch {}
  }, []);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        {/* Top Navbar handles navigation on all breakpoints */}

        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profiles"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientProfiles />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/client-profiles/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ClientProfileDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/shareholders"
          element={
            <ProtectedRoute>
              <Layout>
                <Shareholders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dmat"
          element={
            <ProtectedRoute>
              <Layout>
                <DmatAccounts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
