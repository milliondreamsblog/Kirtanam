"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Edit3,
  FolderKanban,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/auth-client";
import { supabase } from "@/lib/supabase";

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

interface AccountDetail {
  account: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    accent_color: string;
    is_active: boolean;
  };
  channels: Channel[];
  users: Array<{
    id: string;
    email: string;
    full_name: string | null;
    temple: string | null;
    role: number;
    granted_at: string | null;
  }>;
}

interface ChannelDraft {
  id?: string;
  channel_id?: string;
  name?: string;
  handle?: string;
  custom_logo?: string;
  banner_style?: string;
  is_active?: boolean;
}

interface AccountDraft {
  id?: string;
  slug: string;
  name: string;
  description: string;
  accent_color: string;
  is_active: boolean;
}

const DEFAULT_ACCOUNT: AccountDraft = {
  slug: "",
  name: "",
  description: "",
  accent_color: "#7A8F78",
  is_active: true,
};

const DEFAULT_CHANNEL: ChannelDraft = {
  channel_id: "",
  name: "",
  handle: "",
  custom_logo: "",
  banner_style: "linear-gradient(135deg, #7A8F78 0%, #3E4A45 100%)",
  is_active: true,
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [accountDraft, setAccountDraft] = useState<AccountDraft>(DEFAULT_ACCOUNT);
  const [channelDraft, setChannelDraft] = useState<ChannelDraft>(DEFAULT_CHANNEL);
  const [fetchingYoutube, setFetchingYoutube] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const loadBase = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsRes, channelsRes] = await Promise.all([
        authFetch("/api/admin/accounts"),
        authFetch("/api/admin/youtube-channels"),
      ]);

      if (!accountsRes.ok || !channelsRes.ok) {
        throw new Error("Failed to load accounts");
      }

      const accountsJson = await accountsRes.json();
      const channelsJson = await channelsRes.json();

      const nextAccounts = (accountsJson.accounts ?? []) as AccountSummary[];
      const nextChannels = (channelsJson.channels ?? []) as Channel[];

      setAccounts(nextAccounts);
      setAllChannels(nextChannels);

      if (!selectedAccountId && nextAccounts[0]?.id) {
        setSelectedAccountId(nextAccounts[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAccountId]);

  const loadAccountDetail = useCallback(async (accountId: string) => {
    setLoadingDetail(true);
    try {
      const res = await authFetch(`/api/admin/accounts/${accountId}`);
      if (!res.ok) throw new Error("Failed to load account detail");
      const detail = (await res.json()) as AccountDetail;
      setSelectedAccount(detail);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    void loadBase();
  }, [loadBase]);

  useEffect(() => {
    if (!selectedAccountId) return;
    void loadAccountDetail(selectedAccountId);
  }, [selectedAccountId, loadAccountDetail]);

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((account) =>
      [account.name, account.slug, account.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [accounts, search]);

  const attachedChannelIds = useMemo(
    () => new Set(selectedAccount?.channels.map((channel) => channel.channel_id) ?? []),
    [selectedAccount],
  );

  const availableChannels = useMemo(
    () =>
      allChannels.filter((channel) => !attachedChannelIds.has(channel.channel_id)),
    [allChannels, attachedChannelIds],
  );

  const openCreateAccount = () => {
    setAccountDraft(DEFAULT_ACCOUNT);
    setAccountModalOpen(true);
  };

  const openEditAccount = () => {
    if (!selectedAccount) return;
    setAccountDraft({
      id: selectedAccount.account.id,
      slug: selectedAccount.account.slug,
      name: selectedAccount.account.name,
      description: selectedAccount.account.description ?? "",
      accent_color: selectedAccount.account.accent_color,
      is_active: selectedAccount.account.is_active,
    });
    setAccountModalOpen(true);
  };

  const saveAccount = async () => {
    const method = accountDraft.id ? "PUT" : "POST";
    const res = await authFetch("/api/admin/accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountDraft),
    });

    if (!res.ok) {
      alert("Failed to save account");
      return;
    }

    const json = await res.json();
    const createdId = json.account?.id as string | undefined;
    setAccountModalOpen(false);
    await loadBase();
    if (createdId) {
      setSelectedAccountId(createdId);
    }
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;
    if (!confirm(`Delete "${selectedAccount.account.name}"?`)) return;

    const res = await authFetch(
      `/api/admin/accounts?id=${encodeURIComponent(selectedAccount.account.id)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      alert("Failed to delete account");
      return;
    }

    setSelectedAccount(null);
    setSelectedAccountId(null);
    await loadBase();
  };

  const attachChannels = async (channelIds: string[]) => {
    if (!selectedAccount) return;

    const res = await authFetch(
      `/api/admin/accounts/${selectedAccount.account.id}/channels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelIds }),
      },
    );

    if (!res.ok) {
      alert("Failed to attach channels");
      return;
    }

    await Promise.all([loadBase(), loadAccountDetail(selectedAccount.account.id)]);
  };

  const removeChannel = async (channelId: string) => {
    if (!selectedAccount) return;

    const res = await authFetch(
      `/api/admin/accounts/${selectedAccount.account.id}/channels?channelId=${encodeURIComponent(channelId)}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      alert("Failed to remove channel");
      return;
    }

    await Promise.all([loadBase(), loadAccountDetail(selectedAccount.account.id)]);
  };

  // Per-channel sync state. Map<channel_id, "pending" | "ok" | "error">
  const [syncStatus, setSyncStatus] = useState<
    Record<string, "pending" | "ok" | "error">
  >({});
  const [syncMessage, setSyncMessage] = useState<Record<string, string>>({});

  const syncChannel = async (channelId: string, isIncremental = false) => {
    setSyncStatus((prev) => ({ ...prev, [channelId]: "pending" }));
    setSyncMessage((prev) => {
      const next = { ...prev };
      delete next[channelId];
      return next;
    });

    try {
      const res = await authFetch("/api/admin/youtube/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId, isIncremental }),
      });

      const body = (await res.json().catch(() => ({}))) as {
        totalSynced?: number;
        error?: string;
      };

      if (!res.ok) {
        setSyncStatus((prev) => ({ ...prev, [channelId]: "error" }));
        setSyncMessage((prev) => ({
          ...prev,
          [channelId]: body.error ?? `HTTP ${res.status}`,
        }));
        return;
      }

      setSyncStatus((prev) => ({ ...prev, [channelId]: "ok" }));
      setSyncMessage((prev) => ({
        ...prev,
        [channelId]: `Synced ${body.totalSynced ?? 0} videos`,
      }));

      // Auto-clear the success label after a few seconds.
      window.setTimeout(() => {
        setSyncStatus((prev) => {
          if (prev[channelId] !== "ok") return prev;
          const next = { ...prev };
          delete next[channelId];
          return next;
        });
      }, 4000);
    } catch (err: unknown) {
      setSyncStatus((prev) => ({ ...prev, [channelId]: "error" }));
      setSyncMessage((prev) => ({
        ...prev,
        [channelId]: err instanceof Error ? err.message : "Network error",
      }));
    }
  };

  const openCreateChannel = () => {
    setChannelDraft(DEFAULT_CHANNEL);
    setChannelModalOpen(true);
  };

  const handleFetchYoutube = async () => {
    if (!channelDraft.channel_id) return;
    setFetchingYoutube(true);
    try {
      const res = await authFetch(
        `/api/youtube?channelId=${encodeURIComponent(channelDraft.channel_id)}`,
      );
      const data = await res.json();
      if (data.channelTitle) {
        setChannelDraft((prev) => ({
          ...prev,
          name: data.channelTitle as string,
          handle: (data.channelTitle as string).replace(/\s+/g, ""),
          custom_logo: data.channelLogo as string,
        }));
      }
    } finally {
      setFetchingYoutube(false);
    }
  };

  const handleChannelLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${channelDraft.channel_id || Date.now()}.${fileExt}`;
      const uploadPath = `logos/${fileName}`;
      const { error } = await supabase.storage
        .from("youtube-assets")
        .upload(uploadPath, file, { upsert: true });
      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("youtube-assets").getPublicUrl(uploadPath);

      setChannelDraft((prev) => ({
        ...prev,
        custom_logo: publicUrl,
      }));
    } catch {
      alert("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const saveChannel = async () => {
    if (!channelDraft.channel_id?.trim()) {
      alert("Channel ID is required (the UC... value)");
      return;
    }
    if (!channelDraft.name?.trim()) {
      alert("Channel name is required");
      return;
    }

    const method = channelDraft.id ? "PUT" : "POST";
    const res = await authFetch("/api/admin/youtube-channels", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(channelDraft),
    });

    if (!res.ok) {
      let detail = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        if (body?.error) detail = body.error;
      } catch {}
      console.error("[saveChannel] failed:", detail);
      alert(`Failed to save channel: ${detail}`);
      return;
    }

    setChannelModalOpen(false);
    await loadBase();
  };

  return (
    <div className="flex h-[calc(100vh-0px)] lg:h-screen flex-col bg-white">
      {/* Top toolbar — page title + search + new */}
      <div className="flex items-center gap-3 border-b border-neutral-200 px-4 h-12 lg:px-6">
        <h1 className="text-[14px] font-semibold text-neutral-900">Accounts</h1>
        <span className="text-[12px] text-neutral-500">
          {accounts.length} {accounts.length === 1 ? "bundle" : "bundles"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search accounts"
              className="w-48 sm:w-64 rounded-md border border-neutral-200 bg-white py-1.5 pl-7 pr-2 text-[13px] outline-none focus:border-neutral-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadBase()}
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={openCreateAccount}
            className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 h-7 text-[12px] font-medium text-white hover:bg-neutral-800"
          >
            <Plus className="h-3.5 w-3.5" />
            New account
          </button>
        </div>
      </div>

      {/* Two-pane layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: account list */}
        <aside className="w-72 flex-shrink-0 border-r border-neutral-200 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="px-4 py-12 text-center text-[13px] text-neutral-500">
              No accounts yet.
            </div>
          ) : (
            <ul>
              {filteredAccounts.map((account) => {
                const active = selectedAccountId === account.id;
                return (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`flex w-full items-center gap-2 px-4 py-2 text-left border-l-2 transition-colors ${
                        active
                          ? "border-[#7A8F78] bg-neutral-50"
                          : "border-transparent hover:bg-neutral-50"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-neutral-900">
                          {account.name}
                        </p>
                        <p className="truncate text-[11px] text-neutral-500">
                          {account.description || account.slug}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2 text-[11px] text-neutral-500">
                        <span>{account.channel_count}ch</span>
                        <span>·</span>
                        <span>{account.user_count}u</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Right: detail */}
        <section className="flex-1 min-w-0 overflow-y-auto">
          {!selectedAccountId ? (
            <div className="flex h-full items-center justify-center text-[13px] text-neutral-500">
              Select an account from the list
            </div>
          ) : loadingDetail || !selectedAccount ? (
            <div className="flex h-full items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin text-neutral-400" />
            </div>
          ) : (
            <div>
              {/* Detail header */}
              <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ background: selectedAccount.account.accent_color }}
                    />
                    <h2 className="truncate text-[16px] font-semibold text-neutral-900">
                      {selectedAccount.account.name}
                    </h2>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        selectedAccount.account.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {selectedAccount.account.is_active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  {selectedAccount.account.description && (
                    <p className="mt-1 text-[12px] text-neutral-500 line-clamp-1">
                      {selectedAccount.account.description}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-neutral-400">
                    {selectedAccount.channels.length} channels ·{" "}
                    {selectedAccount.users.length} users · /
                    {selectedAccount.account.slug}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={openEditAccount}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 h-7 text-[12px] text-neutral-700 hover:bg-neutral-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={deleteAccount}
                    className="inline-flex items-center gap-1 rounded-md border border-neutral-200 px-2 h-7 text-[12px] text-neutral-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="grid gap-px bg-neutral-200 lg:grid-cols-2">
                {/* Attached channels */}
                <div className="bg-white">
                  <div className="flex items-center justify-between border-b border-neutral-200 px-6 h-10">
                    <p className="text-[12px] font-medium text-neutral-700">
                      Attached channels ({selectedAccount.channels.length})
                    </p>
                    <button
                      type="button"
                      onClick={openCreateChannel}
                      className="inline-flex items-center gap-1 rounded-md px-2 h-6 text-[11px] text-neutral-700 hover:bg-neutral-100"
                    >
                      <Plus className="h-3 w-3" />
                      New channel
                    </button>
                  </div>
                  {selectedAccount.channels.length === 0 ? (
                    <p className="px-6 py-6 text-[12px] text-neutral-500">
                      No channels attached.
                    </p>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {selectedAccount.channels.map((channel) => {
                        const status = syncStatus[channel.channel_id];
                        const message = syncMessage[channel.channel_id];
                        const isPending = status === "pending";
                        return (
                          <li
                            key={channel.channel_id}
                            className="group flex items-center gap-2.5 px-6 h-11 hover:bg-neutral-50"
                          >
                            <ChannelAvatar channel={channel} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-neutral-900">
                                {channel.name}
                              </p>
                              <p className="truncate text-[11px] text-neutral-500">
                                {message ? (
                                  <span
                                    className={
                                      status === "error"
                                        ? "text-[#C97064]"
                                        : status === "ok"
                                          ? "text-[#7A8F78]"
                                          : "text-neutral-500"
                                    }
                                  >
                                    {message}
                                  </span>
                                ) : (
                                  channel.handle || channel.channel_id
                                )}
                              </p>
                            </div>

                            {/* Sync button */}
                            <button
                              type="button"
                              onClick={() =>
                                void syncChannel(channel.channel_id, false)
                              }
                              disabled={isPending}
                              className={`flex items-center gap-1 rounded-md px-2 h-7 text-[11px] font-medium transition-colors ${
                                isPending
                                  ? "text-neutral-400 cursor-not-allowed"
                                  : "text-[#3E4A45] opacity-0 group-hover:opacity-100 hover:bg-[#e6ebe2]"
                              }`}
                              title="Pull latest videos from YouTube"
                            >
                              {isPending ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Syncing
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3" />
                                  Sync
                                </>
                              )}
                            </button>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() =>
                                void removeChannel(channel.channel_id)
                              }
                              className="rounded-md p-1 text-neutral-400 opacity-0 hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                              title="Remove"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Available library */}
                <div className="bg-white">
                  <div className="flex items-center border-b border-neutral-200 px-6 h-10">
                    <p className="text-[12px] font-medium text-neutral-700">
                      Library ({availableChannels.length})
                    </p>
                  </div>
                  {availableChannels.length === 0 ? (
                    <p className="px-6 py-6 text-[12px] text-neutral-500">
                      Everything in the library is attached.
                    </p>
                  ) : (
                    <ul className="divide-y divide-neutral-100">
                      {availableChannels.map((channel) => (
                        <li key={channel.channel_id}>
                          <button
                            type="button"
                            onClick={() => void attachChannels([channel.channel_id])}
                            className="flex w-full items-center gap-2.5 px-6 h-11 text-left hover:bg-neutral-50"
                          >
                            <ChannelAvatar channel={channel} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-neutral-900">
                                {channel.name}
                              </p>
                              <p className="truncate text-[11px] text-neutral-500">
                                {channel.handle || channel.channel_id}
                              </p>
                            </div>
                            <Plus className="h-3.5 w-3.5 text-neutral-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Linked users */}
              <div className="border-t border-neutral-200 bg-white">
                <div className="flex items-center border-b border-neutral-200 px-6 h-10">
                  <p className="text-[12px] font-medium text-neutral-700">
                    Linked users ({selectedAccount.users.length})
                  </p>
                </div>
                {selectedAccount.users.length === 0 ? (
                  <p className="px-6 py-6 text-[12px] text-neutral-500">
                    No users linked.
                  </p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {selectedAccount.users.map((user) => (
                      <li
                        key={user.id}
                        className="flex items-center gap-3 px-6 h-10"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] text-neutral-900">
                            {user.full_name || user.email}
                          </p>
                        </div>
                        <p className="truncate text-[11px] text-neutral-500">
                          {user.temple || user.email}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 h-11">
              <h2 className="text-[14px] font-semibold text-neutral-900">
                {accountDraft.id ? "Edit account" : "New account"}
              </h2>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 px-4 py-4">
              <LabeledInput
                label="Account Name"
                value={accountDraft.name}
                onChange={(value) =>
                  setAccountDraft((prev) => ({
                    ...prev,
                    name: value,
                    slug:
                      prev.id || prev.slug
                        ? prev.slug
                        : value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, ""),
                  }))
                }
                placeholder="Engineering Student Monk"
              />
              <LabeledInput
                label="Slug"
                value={accountDraft.slug}
                onChange={(value) =>
                  setAccountDraft((prev) => ({ ...prev, slug: value }))
                }
                placeholder="engineering-student-monk"
              />
              <LabeledTextarea
                label="Description"
                value={accountDraft.description}
                onChange={(value) =>
                  setAccountDraft((prev) => ({ ...prev, description: value }))
                }
                placeholder="Reusable study bundle for engineering students."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <LabeledInput
                  label="Accent color"
                  value={accountDraft.accent_color}
                  onChange={(value) =>
                    setAccountDraft((prev) => ({ ...prev, accent_color: value }))
                  }
                  placeholder="#7A8F78"
                />
                <label className="grid gap-1">
                  <span className="text-[11px] font-medium text-neutral-600">
                    Status
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAccountDraft((prev) => ({
                        ...prev,
                        is_active: !prev.is_active,
                      }))
                    }
                    className={`rounded-md border px-2.5 h-8 text-left text-[13px] ${
                      accountDraft.is_active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500"
                    }`}
                  >
                    {accountDraft.is_active ? "Active" : "Hidden"}
                  </button>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 h-12 items-center">
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded-md border border-neutral-200 px-2.5 h-7 text-[12px] text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveAccount()}
                className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 h-7 text-[12px] font-medium text-white hover:bg-neutral-800"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {channelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 h-11">
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Add YouTube channel
              </h2>
              <button
                type="button"
                onClick={() => setChannelModalOpen(false)}
                className="rounded p-1 text-neutral-500 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 px-4 py-4">
              <label className="grid gap-1">
                <span className="text-[11px] font-medium text-neutral-600">
                  Channel ID
                </span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={channelDraft.channel_id || ""}
                    onChange={(event) =>
                      setChannelDraft((prev) => ({
                        ...prev,
                        channel_id: event.target.value,
                      }))
                    }
                    placeholder="UC..."
                    className="flex-1 rounded-md border border-neutral-200 bg-white px-2.5 h-8 text-[13px] outline-none focus:border-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={() => void handleFetchYoutube()}
                    disabled={!channelDraft.channel_id || fetchingYoutube}
                    className="rounded-md border border-neutral-200 px-2.5 h-8 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40"
                  >
                    {fetchingYoutube ? "Loading…" : "Fetch"}
                  </button>
                </div>
              </label>

              <LabeledInput
                label="Display name"
                value={channelDraft.name || ""}
                onChange={(value) =>
                  setChannelDraft((prev) => ({ ...prev, name: value }))
                }
                placeholder="Channel name"
              />

              <LabeledInput
                label="Handle"
                value={channelDraft.handle || ""}
                onChange={(value) =>
                  setChannelDraft((prev) => ({ ...prev, handle: value }))
                }
                placeholder="EngineeringMonk"
              />

              <div>
                <p className="mb-1.5 text-[11px] font-medium text-neutral-600">
                  Logo
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                    {channelDraft.custom_logo ? (
                      <Image
                        src={channelDraft.custom_logo}
                        alt="Channel logo"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Globe className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 h-8 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingLogo ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(event) => void handleChannelLogoUpload(event)}
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-200 px-4 h-12 items-center">
              <button
                type="button"
                onClick={() => setChannelModalOpen(false)}
                className="rounded-md border border-neutral-200 px-2.5 h-7 text-[12px] text-neutral-700 hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveChannel()}
                className="inline-flex items-center gap-1.5 rounded-md bg-neutral-900 px-2.5 h-7 text-[12px] font-medium text-white hover:bg-neutral-800"
              >
                <Check className="h-3.5 w-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelAvatar({ channel }: { channel: Channel }) {
  if (channel.custom_logo) {
    return (
      <Image
        src={channel.custom_logo}
        alt={channel.name}
        width={28}
        height={28}
        className="h-7 w-7 rounded object-cover flex-shrink-0"
        unoptimized
      />
    );
  }

  return (
    <div className="flex h-7 w-7 items-center justify-center rounded bg-neutral-100 text-neutral-500 flex-shrink-0">
      <FolderKanban className="h-3.5 w-3.5" />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-md border border-neutral-200 bg-white px-2.5 h-8 text-[13px] outline-none focus:border-neutral-400"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-medium text-neutral-600">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-neutral-400 resize-y"
      />
    </label>
  );
}
