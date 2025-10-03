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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card p-6">
        <h1 className="text-lg font-bold mb-6">ShareMarket Manager Pro</h1>
        <nav className="flex flex-col gap-4 text-sm">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `hover:underline ${isActive ? "text-primary font-semibold" : ""}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/profiles"
            className={({ isActive }) =>
              `hover:underline ${isActive ? "text-primary font-semibold" : ""}`
            }
          >
            Profiles
          </NavLink>
          <NavLink
            to="/shareholders"
            className={({ isActive }) =>
              `hover:underline ${isActive ? "text-primary font-semibold" : ""}`
            }
          >
            Shareholders
          </NavLink>
          <NavLink
            to="/dmat"
            className={({ isActive }) =>
              `hover:underline ${isActive ? "text-primary font-semibold" : ""}`
            }
          >
            DMAT
          </NavLink>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profiles" element={<ClientProfiles />} />
        <Route path="/client-profiles/:id" element={<ClientProfileDetails />} />
        <Route path="/shareholders" element={<Shareholders />} />
        <Route path="/dmat" element={<DmatAccounts />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
