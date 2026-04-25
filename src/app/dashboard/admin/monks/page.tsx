"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users, ArrowRight, Activity } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface Monk {
  id: string;
  email: string;
  full_name: string | null;
  mobile: string | null;
  temple: string | null;
  role: number;
  created_at: string;
  assigned_channel_count: number;
  last_active_at: string | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function MonksListPage() {
  const [monks, setMonks] = useState<Monk[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch("/api/admin/monks");
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!cancelled) setMonks(data.monks ?? []);
      } catch (e: any) {
        if (!cancelled) setErr(e.message ?? "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return monks;
    return monks.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.temple ?? "").toLowerCase().includes(q)
    );
  }, [monks, search]);

  const stats = useMemo(() => {
    const total = monks.length;
    const withAccess = monks.filter((m) => m.assigned_channel_count > 0).length;
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const activeToday = monks.filter(
      (m) => m.last_active_at && new Date(m.last_active_at).getTime() > dayAgo
    ).length;
    return { total, withAccess, activeToday };
  }, [monks]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Monks</h1>
          <p className="text-slate-500 text-sm">
            Manage per-monk YouTube channel access and activity.
          </p>
        </div>
        <Link
          href="/dashboard/admin/activity"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
        >
          <Activity className="w-4 h-4" />
          Activity Feed
        </Link>
      </header>

      <section className="grid grid-cols-3 gap-3">
        <StatCard label="Total Monks" value={stats.total} />
        <StatCard label="With Channel Access" value={stats.withAccess} />
        <StatCard label="Active Today" value={stats.activeToday} />
      </section>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email, name, or temple"
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading monks…</div>
        ) : err ? (
          <div className="p-8 text-center text-sm text-red-500">{err}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
            <Users className="w-6 h-6" />
            No monks found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Monk</th>
                <th className="text-left px-4 py-3">Temple</th>
                <th className="text-right px-4 py-3">Channels</th>
                <th className="text-right px-4 py-3">Last Active</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{m.full_name ?? "—"}</div>
                    <div className="text-xs text-slate-400">{m.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{m.temple ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                        m.assigned_channel_count === 0
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {m.assigned_channel_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500 text-xs">
                    {relativeTime(m.last_active_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/admin/monks/${m.id}`}
                      className="inline-flex items-center gap-1 text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline"
                    >
                      Manage <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="text-3xl font-black mt-1">{value}</div>
    </div>
  );
}
