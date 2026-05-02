"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search, Users } from "lucide-react";
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
  if (!iso) return "—";
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

function initials(name: string | null, email: string): string {
  const source = (name && name.trim()) || email;
  const parts = source.split(/[\s@.]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").concat(parts[1]?.[0] ?? "").toUpperCase();
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
    <div className="flex h-screen flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 h-12 lg:px-6">
        <h1 className="text-[14px] font-semibold text-neutral-900">Users</h1>
        <span className="text-[12px] text-neutral-500">
          {users.length} total
        </span>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, temple"
            className="w-56 sm:w-72 rounded-md border border-neutral-200 bg-white py-1.5 pl-7 pr-2 text-[13px] outline-none focus:border-neutral-400"
          />
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_56px_56px_56px_88px_24px] items-center gap-3 border-b border-neutral-200 bg-neutral-50/60 px-4 lg:px-6 h-9 text-[11px] font-medium text-neutral-500">
        <div>User</div>
        <div>Temple</div>
        <div className="text-right">Accts</div>
        <div className="text-right">Direct</div>
        <div className="text-right">Effective</div>
        <div className="text-right">Last active</div>
        <div />
      </div>

      {/* Table body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-6 py-12 text-center text-[13px] text-neutral-500">
            Loading users…
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-5 w-5 text-neutral-300" />
            <p className="mt-2 text-[13px] text-neutral-500">No users found.</p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {filteredUsers.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/dashboard/admin/users/${user.id}`}
                  className="group grid grid-cols-[minmax(0,1fr)_24px] md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_56px_56px_56px_88px_24px] items-center gap-3 px-4 lg:px-6 h-11 hover:bg-neutral-50"
                >
                  {/* User */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600">
                      {initials(user.full_name, user.email)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-neutral-900">
                        {user.full_name || user.email}
                      </p>
                      <p className="truncate text-[11px] text-neutral-500">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Temple */}
                  <div className="hidden md:block min-w-0 truncate text-[12px] text-neutral-600">
                    {user.temple || (
                      <span className="text-neutral-400">—</span>
                    )}
                  </div>

                  {/* Counts */}
                  <div className="hidden md:block text-right text-[13px] tabular-nums text-neutral-700">
                    {user.assigned_account_count ?? 0}
                  </div>
                  <div className="hidden md:block text-right text-[13px] tabular-nums text-neutral-700">
                    {user.assigned_channel_count ?? 0}
                  </div>
                  <div className="hidden md:block text-right text-[13px] tabular-nums font-medium text-neutral-900">
                    {user.effective_channel_count ?? 0}
                  </div>

                  {/* Last active */}
                  <div className="hidden md:block text-right text-[12px] text-neutral-500">
                    {relativeTime(user.last_active_at)}
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-neutral-300 group-hover:text-neutral-500" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
