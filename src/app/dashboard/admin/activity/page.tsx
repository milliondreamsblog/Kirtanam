"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface Entry {
  id: number;
  user_id: string;
  action: string;
  channel_id: string | null;
  video_id: string | null;
  query: string | null;
  metadata: any;
  created_at: string;
  user: { email: string; full_name: string | null };
  channel_name: string | null;
}

const ACTIONS = [
  "view_channel",
  "play_video",
  "search",
  "access_denied",
  "open_external",
] as const;

export default function ActivityFeedPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (action) params.set("action", action);
      const res = await authFetch(`/api/admin/activity?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const j = await res.json();
      setEntries(j.entries ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [action]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/admin/monks"
            className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-500"
          >
            <ArrowLeft className="w-3 h-3" /> Monks
          </Link>
          <h1 className="text-2xl font-black tracking-tight mt-2">Activity Feed</h1>
          <p className="text-slate-500 text-sm">
            Everything monks have done recently, newest first.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </header>

      <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400" />
        <button
          onClick={() => setAction("")}
          className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
            action === "" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
          }`}
        >
          All
        </button>
        {ACTIONS.map((a) => (
          <button
            key={a}
            onClick={() => setAction(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
              action === a ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {a.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
        ) : err ? (
          <div className="p-8 text-center text-sm text-red-500">{err}</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No activity.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((e) => (
              <li key={e.id} className="p-4 flex items-start gap-3">
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shrink-0 ${actionColor(
                    e.action
                  )}`}
                >
                  {e.action.replace("_", " ")}
                </span>
                <div className="flex-1 min-w-0 text-sm">
                  <Link
                    href={`/dashboard/admin/monks/${e.user_id}`}
                    className="font-bold text-slate-900 hover:underline"
                  >
                    {e.user.full_name ?? e.user.email}
                  </Link>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">
                    {e.query && <span>searched "{e.query}"</span>}
                    {e.channel_name && <span>on {e.channel_name}</span>}
                    {e.video_id && <span className="font-mono ml-1">({e.video_id})</span>}
                  </div>
                </div>
                <time className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                  {new Date(e.created_at).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function actionColor(action: string): string {
  switch (action) {
    case "view_channel":
      return "bg-blue-50 text-blue-700";
    case "play_video":
      return "bg-emerald-50 text-emerald-700";
    case "search":
      return "bg-amber-50 text-amber-700";
    case "access_denied":
      return "bg-red-50 text-red-700";
    case "open_external":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}
