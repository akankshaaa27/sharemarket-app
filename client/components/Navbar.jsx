import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle.jsx";
import { auth } from "../lib/auth.js";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      setUser(auth.getUser?.());
    } catch {}
  }, []);

  const links = [
    { to: "/", label: "Dashboard" },
    { to: "/profiles", label: "Profiles" },
    { to: "/shareholders", label: "Shareholders" },
    { to: "/dmat", label: "DMAT" },
  ];
  if (user?.role === "admin") links.push({ to: "/users", label: "User Management" });

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden px-3 py-1.5 rounded-md border text-sm"
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              Menu
            </button>
            <div className="font-semibold">ShareMarket Manager Pro</div>
          </div>

          <nav className="hidden md:flex items-center gap-2 text-sm">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-colors hover:bg-accent ${
                    isActive ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <button
                onClick={() => {
                  auth.logout?.();
                  window.location.href = "/login";
                }}
                className="px-3 py-1.5 rounded-md border text-sm hover:bg-accent"
              >
                Logout
              </button>
            ) : (
              <NavLink to="/login" className="px-3 py-1.5 rounded-md border text-sm hover:bg-accent">
                Login
              </NavLink>
            )}
          </div>
        </div>

        {open && (
          <div id="mobile-nav" className="md:hidden mt-3 grid gap-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md transition-colors hover:bg-accent ${
                    isActive ? "bg-accent text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
