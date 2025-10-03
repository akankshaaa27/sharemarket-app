import React, { useEffect, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Index.jsx";
import Shareholders from "./pages/Shareholders.jsx";
import DmatAccounts from "./pages/DmatAccounts.jsx";
import ClientProfiles from "./pages/ClientProfiles.jsx";
import ClientProfileDetails from "./pages/ClientProfileDetails.jsx";
import NotFound from "./pages/NotFound.jsx";

function ThemeToggle() {
  const [theme, setTheme] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("theme") || "light"
      : "light",
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
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card/80 md:backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="p-6 border-b">
            <h1 className="text-lg font-bold">ShareMarket Manager Pro</h1>
          </div>
          <nav className="flex flex-col gap-1 p-3 text-sm">
            {[
              { to: "/", label: "Dashboard" },
              { to: "/profiles", label: "Profiles" },
              { to: "/shareholders", label: "Shareholders" },
              { to: "/dmat", label: "DMAT" },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-colors hover:bg-accent ${
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto p-4 border-t">
            <ThemeToggle />
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 flex items-center justify-between border-b bg-card/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-3 py-1.5 rounded border text-sm"
            aria-expanded={open}
            aria-controls="mobile-sidebar"
          >
            Menu
          </button>
          <div className="font-semibold">ShareMarket Manager Pro</div>
          <ThemeToggle />
        </div>

        {/* Mobile sidebar drawer */}
        {open && (
          <div className="md:hidden fixed inset-0 z-30">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setOpen(false)}
            />
            <div
              id="mobile-sidebar"
              className="absolute left-0 top-0 h-full w-64 border-r bg-card p-4 shadow-xl"
            >
              <nav className="flex flex-col gap-1 text-sm">
                {[
                  { to: "/", label: "Dashboard" },
                  { to: "/profiles", label: "Profiles" },
                  { to: "/shareholders", label: "Shareholders" },
                  { to: "/dmat", label: "DMAT" },
                ].map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md transition-colors hover:bg-accent ${
                        isActive
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
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
