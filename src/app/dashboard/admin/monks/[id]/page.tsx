"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, Trash2, Heart, Activity } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface MonkDetail {
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    mobile: string | null;
    temple: string | null;
    role: number;
    created_at: string;
  };
  assignedChannels: Array<{
    channel_id: string;
    name: string;
    handle: string | null;
    custom_logo: string | null;
    is_active: boolean;
    granted_at: string;
  }>;
  favorites: Array<{ video_id: string; created_at: string }>;
  activity30d: Record<string, number>;
}

interface AllChannelsResponse {
  channels: Array<{
    id: string;
    channel_id: string;
    name: string;
    handle: string | null;
    custom_logo: string | null;
    is_active: boolean;
  }>;
}

interface ActivityEntry {
  id: number;
  action: string;
  channel_id: string | null;
  video_id: string | null;
  query: string | null;
  metadata: any;
  created_at: string;
}

type Tab = "channels" | "activity" | "favorites";

export default function MonkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<MonkDetail | null>(null);
  const [allChannels, setAllChannels] = useState<AllChannelsResponse["channels"]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [tab, setTab] = useState<Tab>("channels");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    try {
      const [dRes, cRes] = await Promise.all([
        authFetch(`/api/admin/monks/${id}`),
        authFetch("/api/admin/youtube-channels"),
      ]);
      if (!dRes.ok) throw new Error(await dRes.text());
      const dJson = await dRes.json();
      setDetail(dJson);
      const cJson = await cRes.json();
      setAllChannels(cJson.channels ?? []);
    } catch (e: any) {
      setErr(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [id]);

  useEffect(() => {
    if (tab !== "activity") return;
    (async () => {
      const res = await authFetch(`/api/admin/monks/${id}/activity`);
      if (res.ok) {
        const j = await res.json();
        setActivity(j.entries ?? []);
      }
    })();
  }, [id, tab]);

  const assignedIds = useMemo(
    () => new Set(detail?.assignedChannels.map((c) => c.channel_id) ?? []),
    [detail]
  );

  const unassignedChannels = useMemo(
    () => allChannels.filter((c) => !assignedIds.has(c.channel_id)),
    [allChannels, assignedIds]
  );

  async function assign(channelIds: string[]) {
    const res = await authFetch(`/api/admin/monks/${id}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds }),
    });
    if (!res.ok) {
      alert("Failed to assign");
      return;
    }
    setPickerOpen(false);
    reload();
  }

  async function revoke(channelId: string) {
    if (!confirm("Revoke this channel from this monk?")) return;
    const res = await authFetch(
      `/api/admin/monks/${id}/channels?channelId=${encodeURIComponent(channelId)}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      alert("Failed to revoke");
      return;
    }
    reload();
  }

  if (loading) {
    return <div className="p-8 text-sm text-slate-400">Loading…</div>;
  }
  if (err || !detail) {
    return <div className="p-8 text-sm text-red-500">{err ?? "Not found"}</div>;
  }

  const { profile, favorites, activity30d } = detail;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-3 h-3" /> Back
      </button>

      <header className="bg-white rounded-2xl border border-slate-100 p-6">
        <h1 className="text-xl font-black tracking-tight">
          {profile.full_name ?? profile.email}
        </h1>
        <p className="text-sm text-slate-500">{profile.email}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          {profile.temple && <span>Temple: {profile.temple}</span>}
          {profile.mobile && <span>Mobile: {profile.mobile}</span>}
          <span>Role: {profile.role}</span>
          <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Channels" value={detail.assignedChannels.length} />
        <Stat label="Favorites" value={favorites.length} />
        <Stat label="Views 30d" value={activity30d.view_channel ?? 0} />
        <Stat label="Plays 30d" value={activity30d.play_video ?? 0} />
        <Stat label="Denials 30d" value={activity30d.access_denied ?? 0} />
      </section>

      <nav className="flex gap-2 text-xs font-black uppercase tracking-widest">
        {(["channels", "activity", "favorites"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl ${
              tab === t ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      {tab === "channels" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-widest">
              Assigned Channels
            </h2>
            <button
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" /> Assign
            </button>
          </div>

          {detail.assignedChannels.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">
              No channels assigned. Monk sees nothing until you assign at least one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {detail.assignedChannels.map((c) => (
                <li key={c.channel_id} className="py-3 flex items-center gap-3">
                  {c.custom_logo ? (
                    <Image
                      src={c.custom_logo}
                      alt={c.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">{c.name}</div>
                    <div className="text-xs text-slate-400">
                      {c.handle ?? c.channel_id}
                      {!c.is_active && (
                        <span className="ml-2 text-amber-600">(inactive)</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => revoke(c.channel_id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                    title="Revoke"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {activity.map((e) => (
                <li key={e.id} className="py-3 flex items-start gap-3">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${actionColor(
                      e.action
                    )}`}
                  >
                    {e.action.replace("_", " ")}
                  </span>
                  <div className="flex-1 text-xs text-slate-600">
                    {e.query && <div>"{e.query}"</div>}
                    {e.video_id && <div className="text-slate-400">video: {e.video_id}</div>}
                    {e.channel_id && (
                      <div className="text-slate-400">channel: {e.channel_id}</div>
                    )}
                  </div>
                  <time className="text-[10px] text-slate-400 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "favorites" && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h2 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Heart className="w-4 h-4" /> Favorites
          </h2>
          {favorites.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No favorites yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {favorites.map((f) => (
                <li key={f.video_id} className="py-2 flex items-center justify-between">
                  <a
                    href={`https://www.youtube.com/watch?v=${f.video_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:underline text-xs font-mono"
                  >
                    {f.video_id}
                  </a>
                  <time className="text-[10px] text-slate-400">
                    {new Date(f.created_at).toLocaleDateString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {pickerOpen && (
        <ChannelPicker
          channels={unassignedChannels}
          onCancel={() => setPickerOpen(false)}
          onConfirm={assign}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3 text-center">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </div>
      <div className="text-xl font-black">{value}</div>
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

function ChannelPicker({
  channels,
  onCancel,
  onConfirm,
}: {
  channels: AllChannelsResponse["channels"];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
        <header className="p-4 border-b border-slate-100">
          <h3 className="font-black uppercase tracking-widest text-sm">Assign Channels</h3>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {channels.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No channels left to assign.
            </p>
          ) : (
            channels.map((c) => (
              <label
                key={c.channel_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(c.channel_id)}
                  onChange={() => toggle(c.channel_id)}
                />
                {c.custom_logo ? (
                  <Image
                    src={c.custom_logo}
                    alt={c.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-sm">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.handle ?? c.channel_id}</div>
                </div>
              </label>
            ))
          )}
        </div>
        <footer className="p-4 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500"
          >
            Cancel
          </button>
          <button
            disabled={selected.size === 0}
            onClick={() => onConfirm(Array.from(selected))}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
          >
            Assign {selected.size || ""}
          </button>
        </footer>
      </div>
    </div>
  );
}
