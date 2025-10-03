import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink, useNavigate } from "react-router-dom";
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
import { LogOut, Users } from "lucide-react";

function Layout({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = auth.getUser();
    setUser(currentUser);
  }, []);

  const handleLogout = () => {
    auth.logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-lg font-bold text-gray-800 mb-6">ShareMarket Manager Pro</h1>
          
          {user && (
            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-600">{user.email}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">{user.role}</p>
            </div>
          )}

          <nav className="flex flex-col gap-2">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/profiles"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              Profiles
            </NavLink>
            <NavLink
              to="/shareholders"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              Shareholders
            </NavLink>
            <NavLink
              to="/dmat"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg transition ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              DMAT
            </NavLink>

            {user && user.role === "admin" && (
              <>
                <div className="border-t border-gray-200 my-3"></div>
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                      isActive
                        ? "bg-blue-600 text-white font-semibold"
                        : "text-gray-700 hover:bg-gray-100"
                    }`
                  }
                >
                  <Users size={18} />
                  User Management
                </NavLink>
              </>
            )}
          </nav>

          <div className="border-t border-gray-200 my-6"></div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center gap-2 justify-center font-medium"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">{children}</main>
      <ToastContainer position="top-right" autoClose={3000} />
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
