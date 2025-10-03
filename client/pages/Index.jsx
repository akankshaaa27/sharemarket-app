import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Index() {
  const [stats, setStats] = useState({ shareholders: 0, profiles: 0, dmat: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [{ total: sTotal }, { total: pTotal }, { total: dTotal }] =
          await Promise.all([
            api.listShareholders().then((r) => ({
              total: r.total || (r.data?.length ?? r.length ?? 0),
            })),
            api.listProfiles().then((r) => ({
              total: r.total || (r.data?.length ?? r.length ?? 0),
            })),
            api.listDmat().then((r) => ({
              total: r.total || (r.data?.length ?? r.length ?? 0),
            })),
          ]);
        if (mounted)
          setStats({ shareholders: sTotal, profiles: pTotal, dmat: dTotal });
      } catch (e) {
        if (mounted) setError(e.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        {
          label: "Shareholders",
          value: stats.shareholders,
        },
        {
          label: "Client Profiles",
          value: stats.profiles,
        },
        {
          label: "DMAT Accounts",
          value: stats.dmat,
        },
      ].map((c) => (
        <div
          key={c.label}
          className="group rounded-xl border bg-card p-5 shadow-sm transition hover:shadow-md hover:border-primary/30"
        >
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-3xl font-extrabold tracking-tight">
            {c.value}
          </div>
          <div className="mt-4 h-2 w-full rounded bg-muted">
            <div
              className="h-2 rounded bg-primary/60 group-hover:bg-primary transition-all"
              style={{ width: "100%" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
