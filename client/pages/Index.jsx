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
            api
              .listShareholders()
              .then((r) => ({
                total: r.total || (r.data?.length ?? r.length ?? 0),
              })),
            api
              .listProfiles()
              .then((r) => ({
                total: r.total || (r.data?.length ?? r.length ?? 0),
              })),
            api
              .listDmat()
              .then((r) => ({
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-lg border p-4 bg-card">
        <div className="text-sm text-muted-foreground">Shareholders</div>
        <div className="text-3xl font-bold">{stats.shareholders}</div>
      </div>
      <div className="rounded-lg border p-4 bg-card">
        <div className="text-sm text-muted-foreground">Client Profiles</div>
        <div className="text-3xl font-bold">{stats.profiles}</div>
      </div>
      <div className="rounded-lg border p-4 bg-card">
        <div className="text-sm text-muted-foreground">DMAT Accounts</div>
        <div className="text-3xl font-bold">{stats.dmat}</div>
      </div>
    </div>
  );
}
