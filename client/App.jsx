import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Index.jsx";
import Shareholders from "./pages/Shareholders.jsx";
import DmatAccounts from "./pages/DmatAccounts.jsx";
import ClientProfiles from "./pages/ClientProfiles.jsx";
import ClientProfileDetails from "./pages/ClientProfileDetails.jsx";
import NotFound from "./pages/NotFound.jsx";

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold">ShareMarket Manager Pro</h1>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `hover:underline ${isActive ? "text-primary" : ""}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/shareholders"
              className={({ isActive }) =>
                `hover:underline ${isActive ? "text-primary" : ""}`
              }
            >
              Shareholders
            </NavLink>
            <NavLink
              to="/dmat"
              className={({ isActive }) =>
                `hover:underline ${isActive ? "text-primary" : ""}`
              }
            >
              DMAT
            </NavLink>
            <NavLink
              to="/profiles"
              className={({ isActive }) =>
                `hover:underline ${isActive ? "text-primary" : ""}`
              }
            >
              Profiles
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="container py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/shareholders" element={<Shareholders />} />
        <Route path="/dmat" element={<DmatAccounts />} />
        <Route path="/profiles" element={<ClientProfiles />} />
        <Route path="/client-profiles/:id" element={<ClientProfileDetails />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
