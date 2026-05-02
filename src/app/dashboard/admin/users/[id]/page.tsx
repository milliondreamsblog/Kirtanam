"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";

interface UserDetailResponse {
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
  assignedAccounts: Array<{
    account_id: string;
    slug: string;
    name: string;
    description: string | null;
    accent_color: string;
    is_active: boolean;
    channel_count: number;
    granted_at: string;
  }>;
  effectiveChannels: Array<{
    channel_id: string;
    name: string;
    handle: string | null;
    custom_logo: string | null;
    is_active: boolean;
    direct: boolean;
    accounts: string[];
  }>;
}

interface Channel {
  id: string;
  channel_id: string;
  name: string;
  handle: string | null;
  custom_logo: string | null;
  is_active: boolean;
}

interface AccountSummary {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  accent_color: string;
  is_active: boolean;
  channel_count: number;
  user_count: number;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [detail, setDetail] = useState<UserDetailResponse | null>(null);
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [channelSearch, setChannelSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, accountsRes, channelsRes] = await Promise.all([
        authFetch(`/api/admin/monks/${id}`),
        authFetch("/api/admin/accounts"),
        authFetch("/api/admin/youtube-channels"),
      ]);

      if (!detailRes.ok || !accountsRes.ok || !channelsRes.ok) {
        throw new Error("Failed to load user detail");
      }

      setDetail((await detailRes.json()) as UserDetailResponse);
      setAccounts(((await accountsRes.json()).accounts ?? []) as AccountSummary[]);
      setChannels(((await channelsRes.json()).channels ?? []) as Channel[]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const linkedAccountIds = useMemo(
    () => new Set(detail?.assignedAccounts.map((account) => account.account_id) ?? []),
    [detail],
  );

  const directChannelIds = useMemo(
    () => new Set(detail?.assignedChannels.map((channel) => channel.channel_id) ?? []),
    [detail],
  );

  const availableAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    return accounts.filter((account) => {
      if (linkedAccountIds.has(account.id)) return false;
      if (!query) return true;
      return [account.name, account.slug, account.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [accounts, linkedAccountIds, accountSearch]);

  const availableDirectChannels = useMemo(() => {
    const query = channelSearch.trim().toLowerCase();
    return channels.filter((channel) => {
      if (directChannelIds.has(channel.channel_id)) return false;
      if (!query) return true;
      return [channel.name, channel.handle ?? "", channel.channel_id]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [channels, directChannelIds, channelSearch]);

  const assignAccounts = async (accountIds: string[]) => {
    const res = await authFetch(`/api/admin/monks/${id}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountIds }),
    });

    if (!res.ok) {
      alert("Failed to assign account");
      return;
    }

    await load();
  };

  const revokeAccount = async (accountId: string) => {
    const res = await authFetch(
      `/api/admin/monks/${id}/accounts?accountId=${encodeURIComponent(accountId)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      alert("Failed to remove account");
      return;
    }

    await load();
  };

  const assignDirectChannel = async (channelIds: string[]) => {
    const res = await authFetch(`/api/admin/monks/${id}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelIds }),
    });

    if (!res.ok) {
      alert("Failed to assign direct channel");
      return;
    }

    await load();
  };

  const revokeDirectChannel = async (channelId: string) => {
    const res = await authFetch(
      `/api/admin/monks/${id}/channels?channelId=${encodeURIComponent(channelId)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      alert("Failed to revoke direct channel");
      return;
    }

    await load();
  };

  if (loading || !detail) {
    return (
      <div className="px-4 py-12 text-center text-sm font-medium text-black/45 md:px-6 lg:px-8">
        Loading user detail...
      </div>
    );
  }

  const { profile, assignedAccounts, assignedChannels, effectiveChannels } = detail;

  return (
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <Link
        href="/dashboard/admin/users"
        className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black/65 shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back To Users
      </Link>

      <div className="mt-4 rounded-[1.75rem] border border-black/6 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#fff1ef] text-[#ff4e45]">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                User
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-black">
                {profile.full_name || profile.email}
              </h1>
              <p className="mt-1 text-sm text-black/45">{profile.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-black/45">
                <span className="rounded-full bg-[#f6f6f6] px-3 py-1">
                  {profile.temple || "No temple"}
                </span>
                <span className="rounded-full bg-[#f6f6f6] px-3 py-1">
                  Role {profile.role}
                </span>
                <span className="rounded-full bg-[#f6f6f6] px-3 py-1">
                  Joined {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Accounts" value={assignedAccounts.length} />
            <MetricCard label="Direct Channels" value={assignedChannels.length} />
            <MetricCard label="Effective Channels" value={effectiveChannels.length} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 2xl:grid-cols-[1fr_1fr]">
        <section className="space-y-4 rounded-[1.75rem] border border-black/6 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                Linked Accounts
              </p>
              <p className="mt-1 text-sm text-black/55">
                Reusable bundles shared across similar users.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {assignedAccounts.length === 0 ? (
              <EmptyCard message="No reusable accounts linked yet." />
            ) : (
              assignedAccounts.map((account) => (
                <div
                  key={account.account_id}
                  className="flex items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfbfb] px-4 py-3"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: account.accent_color }}
                  >
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-black">
                      {account.name}
                    </p>
                    <p className="truncate text-[11px] text-black/45">
                      {account.description || account.slug}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                    {account.channel_count} channels
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeAccount(account.account_id)}
                    className="rounded-xl p-2 text-black/35 hover:bg-[#fff1ef] hover:text-[#ff4e45]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
              Attach Existing Account
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <input
                type="text"
                value={accountSearch}
                onChange={(event) => setAccountSearch(event.target.value)}
                placeholder="Search bundle name"
                className="w-full rounded-2xl border border-black/8 bg-[#f8f8f8] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff4e45]"
              />
            </div>
          </label>

          <div className="grid gap-3">
            {availableAccounts.slice(0, 8).map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => void assignAccounts([account.id])}
                className="flex items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfbfb] px-4 py-3 text-left transition-all hover:border-[#ff4e45]/20 hover:bg-white"
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white"
                  style={{ backgroundColor: account.accent_color }}
                >
                  <Plus className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-black">
                    {account.name}
                  </p>
                  <p className="truncate text-[11px] text-black/45">
                    {account.channel_count} channels • {account.user_count} users
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-[1.75rem] border border-black/6 bg-white p-4 shadow-sm">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
              Direct User Channels
            </p>
            <p className="mt-1 text-sm text-black/55">
              User-specific additions outside shared accounts.
            </p>
          </div>

          <div className="grid gap-3">
            {assignedChannels.length === 0 ? (
              <EmptyCard message="No direct channels assigned." />
            ) : (
              assignedChannels.map((channel) => (
                <div
                  key={channel.channel_id}
                  className="flex items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfbfb] px-4 py-3"
                >
                  <ChannelAvatar channel={channel} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-black">
                      {channel.name}
                    </p>
                    <p className="truncate text-[11px] text-black/45">
                      {channel.handle || channel.channel_id}
                    </p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4e45]">
                    Direct
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeDirectChannel(channel.channel_id)}
                    className="rounded-xl p-2 text-black/35 hover:bg-[#fff1ef] hover:text-[#ff4e45]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <label className="grid gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
              Add Direct Channel
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
              <input
                type="text"
                value={channelSearch}
                onChange={(event) => setChannelSearch(event.target.value)}
                placeholder="Search channel library"
                className="w-full rounded-2xl border border-black/8 bg-[#f8f8f8] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff4e45]"
              />
            </div>
          </label>

          <div className="grid gap-3">
            {availableDirectChannels.slice(0, 8).map((channel) => (
              <button
                key={channel.channel_id}
                type="button"
                onClick={() => void assignDirectChannel([channel.channel_id])}
                className="flex items-center gap-3 rounded-2xl border border-black/6 bg-[#fbfbfb] px-4 py-3 text-left transition-all hover:border-[#ff4e45]/20 hover:bg-white"
              >
                <ChannelAvatar channel={channel} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-black">
                    {channel.name}
                  </p>
                  <p className="truncate text-[11px] text-black/45">
                    {channel.handle || channel.channel_id}
                  </p>
                </div>
                <div className="rounded-xl bg-[#fff1ef] p-2 text-[#ff4e45]">
                  <Plus className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-black/6 bg-white p-4 shadow-sm">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
            Effective Channels Visible To This User
          </p>
          <p className="mt-1 text-sm text-black/55">
            Final access, merged from direct channels and reusable accounts.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {effectiveChannels.map((channel) => (
            <div
              key={channel.channel_id}
              className="rounded-2xl border border-black/6 bg-[#fbfbfb] p-4"
            >
              <div className="flex items-center gap-3">
                <ChannelAvatar channel={channel} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-black">
                    {channel.name}
                  </p>
                  <p className="truncate text-[11px] text-black/45">
                    {channel.handle || channel.channel_id}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {channel.direct && (
                  <span className="rounded-full bg-[#fff1ef] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#ff4e45]">
                    Direct
                  </span>
                )}
                {channel.accounts.map((account) => (
                  <span
                    key={`${channel.channel_id}-${account}`}
                    className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/45"
                  >
                    {account}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#fbfbfb] px-4 py-4 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-black/35">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-black">{value}</p>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-[#fbfbfb] px-4 py-10 text-center text-sm font-medium text-black/45">
      {message}
    </div>
  );
}

function ChannelAvatar({
  channel,
}: {
  channel: { name: string; custom_logo: string | null };
}) {
  if (channel.custom_logo) {
    return (
      <Image
        src={channel.custom_logo}
        alt={channel.name}
        width={48}
        height={48}
        className="h-12 w-12 rounded-2xl object-cover"
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff1ef] text-[#ff4e45]">
      <FolderKanban className="h-5 w-5" />
    </div>
  );
}
