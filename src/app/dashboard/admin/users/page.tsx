"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Users } from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  temple: string | null;
  role: number;
  assigned_channel_count: number;
  assigned_account_count?: number;
  effective_channel_count?: number;
  last_active_at: string | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "No activity";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/api/admin/monks?role=all");
        if (!res.ok) throw new Error("Failed to load users");
        const json = await res.json();
        setUsers((json.monks ?? []) as UserSummary[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.email, user.full_name ?? "", user.temple ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [users, search]);

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-black/6 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/35">
            Users
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-black">
            User access management
          </h1>
        </div>
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, temple"
            className="w-full rounded-2xl border border-black/8 bg-[#f8f8f8] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff4e45]"
          />
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-black/6 bg-white p-3 shadow-sm">
        <div className="grid gap-2">
          {loading ? (
            <div className="px-4 py-16 text-center text-sm font-medium text-black/45">
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-black/20" />
              <p className="mt-3 text-sm font-medium text-black/45">
                No users found.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <Link
                key={user.id}
                href={`/dashboard/admin/users/${user.id}`}
                className="grid gap-3 rounded-2xl border border-black/6 bg-[#fbfbfb] px-4 py-4 transition-all hover:border-[#ff4e45]/20 hover:bg-white md:grid-cols-[minmax(0,1.1fr)_140px_120px_140px_120px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-black">
                    {user.full_name || user.email}
                  </p>
                  <p className="truncate text-[11px] text-black/45">{user.email}</p>
                  <p className="mt-1 text-[11px] font-medium text-black/35">
                    {user.temple || "No temple set"}
                  </p>
                </div>
                <Metric label="Accounts" value={user.assigned_account_count ?? 0} />
                <Metric label="Direct" value={user.assigned_channel_count ?? 0} />
                <Metric label="Effective" value={user.effective_channel_count ?? 0} />
                <div className="flex items-center justify-between md:justify-end">
                  <p className="text-[11px] font-medium text-black/45">
                    {relativeTime(user.last_active_at)}
                  </p>
                  <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#ff4e45]">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/35">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-black">{value}</p>
    </div>
  );
}
