"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Check,
  Edit3,
  FolderKanban,
  Globe,
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
  accent_color: "#ff4e45",
  is_active: true,
};

const DEFAULT_CHANNEL: ChannelDraft = {
  channel_id: "",
  name: "",
  handle: "",
  custom_logo: "",
  banner_style: "linear-gradient(135deg, #ff4e45 0%, #ff7b54 100%)",
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
    <div className="px-4 py-5 md:px-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 rounded-[1.75rem] border border-black/6 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/35">
            Accounts
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-black">
            Reusable YouTube account bundles
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/35" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search account..."
              className="w-full rounded-2xl border border-black/8 bg-[#f8f8f8] py-3 pl-10 pr-4 text-sm outline-none focus:border-[#ff4e45]"
            />
          </div>
          <button
            type="button"
            onClick={openCreateAccount}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#ff4e45] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
          >
            <Plus className="h-4 w-4" />
            New Account
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-[1.75rem] border border-black/6 bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/35">
              Bundle List
            </p>
            <button
              type="button"
              onClick={() => void loadBase()}
              className="rounded-xl p-2 text-black/45 hover:bg-[#f5f5f5] hover:text-black"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-5 w-5 animate-spin text-[#ff4e45]" />
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-[#fafafa] px-4 py-12 text-center">
                <FolderKanban className="mx-auto h-8 w-8 text-black/25" />
                <p className="mt-3 text-sm font-bold text-black/55">
                  No accounts yet
                </p>
              </div>
            ) : (
              filteredAccounts.map((account) => {
                const active = selectedAccountId === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition-all ${
                      active
                        ? "border-[#ff4e45]/25 bg-[#ff4e45] text-white shadow-[0_22px_40px_-28px_rgba(255,78,69,0.85)]"
                        : "border-black/6 bg-[#fbfbfb] text-black hover:border-black/10 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black tracking-tight">
                          {account.name}
                        </p>
                        <p
                          className={`mt-1 truncate text-[11px] font-medium ${
                            active ? "text-white/75" : "text-black/45"
                          }`}
                        >
                          {account.description || account.slug}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          active ? "bg-white/18 text-white" : "bg-white text-black/55"
                        }`}
                      >
                        {account.channel_count}
                      </span>
                    </div>
                    <div
                      className={`mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                        active ? "text-white/75" : "text-black/40"
                      }`}
                    >
                      <span>{account.user_count} users</span>
                      <span>•</span>
                      <span>{account.is_active ? "Active" : "Hidden"}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-black/6 bg-white p-4 shadow-sm md:p-5">
          {!selectedAccountId ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-black/10 bg-[#fafafa] text-center">
              <FolderKanban className="h-10 w-10 text-black/20" />
              <p className="mt-4 text-lg font-black text-black/55">
                Select an account
              </p>
            </div>
          ) : loadingDetail || !selectedAccount ? (
            <div className="flex min-h-[500px] items-center justify-center">
              <RefreshCw className="h-5 w-5 animate-spin text-[#ff4e45]" />
            </div>
          ) : (
            <div className="space-y-5">
              <div
                className="rounded-[1.6rem] border px-5 py-5 text-white"
                style={{
                  background: `linear-gradient(135deg, ${selectedAccount.account.accent_color}, #111111)`,
                  borderColor: `${selectedAccount.account.accent_color}33`,
                }}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white/70">
                      Account Bundle
                    </p>
                    <h2 className="text-3xl font-black tracking-tight">
                      {selectedAccount.account.name}
                    </h2>
                    <p className="max-w-2xl text-sm leading-6 text-white/80">
                      {selectedAccount.account.description ||
                        "Reusable account bundle for users with the same study profile."}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-black uppercase tracking-[0.18em] text-white/75">
                      <span className="rounded-full border border-white/18 px-3 py-1">
                        {selectedAccount.channels.length} channels
                      </span>
                      <span className="rounded-full border border-white/18 px-3 py-1">
                        {selectedAccount.users.length} linked users
                      </span>
                      <span className="rounded-full border border-white/18 px-3 py-1">
                        {selectedAccount.account.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openEditAccount}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white/14 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={deleteAccount}
                      className="inline-flex items-center gap-2 rounded-2xl bg-black/20 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 rounded-[1.5rem] border border-black/6 bg-[#fbfbfb] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                        Channels Inside This Account
                      </p>
                      <p className="mt-1 text-sm text-black/55">
                        These become available to every linked user.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={openCreateChannel}
                      className="inline-flex items-center gap-2 rounded-2xl border border-black/8 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black"
                    >
                      <Plus className="h-4 w-4" />
                      New Channel
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {selectedAccount.channels.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-10 text-center text-sm font-medium text-black/45">
                        No channels attached yet.
                      </div>
                    ) : (
                      selectedAccount.channels.map((channel) => (
                        <div
                          key={channel.channel_id}
                          className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white px-4 py-3"
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
                          <button
                            type="button"
                            onClick={() => void removeChannel(channel.channel_id)}
                            className="rounded-xl p-2 text-black/35 hover:bg-[#fff1ef] hover:text-[#ff4e45]"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-black/6 bg-[#fbfbfb] p-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                      Channel Library
                    </p>
                    <p className="mt-1 text-sm text-black/55">
                      Reuse channels already in the database.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {availableChannels.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-black/10 bg-white px-4 py-10 text-center text-sm font-medium text-black/45">
                        Everything in the library is already attached.
                      </div>
                    ) : (
                      availableChannels.map((channel) => (
                        <button
                          key={channel.channel_id}
                          type="button"
                          onClick={() => void attachChannels([channel.channel_id])}
                          className="flex items-center gap-3 rounded-2xl border border-black/6 bg-white px-4 py-3 text-left transition-all hover:border-[#ff4e45]/20 hover:bg-[#fff7f6]"
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
                      ))
                    )}
                  </div>

                  <div className="rounded-2xl border border-black/6 bg-white px-4 py-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
                      Linked Users
                    </p>
                    <div className="mt-3 space-y-2">
                      {selectedAccount.users.length === 0 ? (
                        <p className="text-sm text-black/45">
                          No users linked yet.
                        </p>
                      ) : (
                        selectedAccount.users.slice(0, 6).map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between rounded-xl bg-[#f8f8f8] px-3 py-2"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-black">
                                {user.full_name || user.email}
                              </p>
                              <p className="truncate text-[11px] text-black/45">
                                {user.temple || user.email}
                              </p>
                            </div>
                            <div className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-black/45">
                              Linked
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-[1.75rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/6 px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                  Account
                </p>
                <h2 className="mt-1 text-xl font-black text-black">
                  {accountDraft.id ? "Edit account" : "Create account"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded-xl p-2 text-black/35 hover:bg-[#f5f5f5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6">
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
              <div className="grid gap-4 sm:grid-cols-2">
                <LabeledInput
                  label="Accent Color"
                  value={accountDraft.accent_color}
                  onChange={(value) =>
                    setAccountDraft((prev) => ({ ...prev, accent_color: value }))
                  }
                  placeholder="#ff4e45"
                />
                <label className="grid gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
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
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold ${
                      accountDraft.is_active
                        ? "border-[#ff4e45]/20 bg-[#fff1ef] text-[#ff4e45]"
                        : "border-black/8 bg-[#f8f8f8] text-black/55"
                    }`}
                  >
                    {accountDraft.is_active ? "Active" : "Hidden"}
                  </button>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-black/6 px-6 py-5">
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="rounded-2xl border border-black/8 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black/55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveAccount()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ff4e45] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                <Save className="h-4 w-4" />
                Save Account
              </button>
            </div>
          </div>
        </div>
      )}

      {channelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-[1.75rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/6 px-6 py-5">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/35">
                  Channel
                </p>
                <h2 className="mt-1 text-xl font-black text-black">
                  Add YouTube channel
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setChannelModalOpen(false)}
                className="rounded-xl p-2 text-black/35 hover:bg-[#f5f5f5]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 px-6 py-6">
              <label className="grid gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
                  Channel ID
                </span>
                <div className="flex gap-2">
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
                    className="flex-1 rounded-2xl border border-black/8 bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#ff4e45]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleFetchYoutube()}
                    disabled={!channelDraft.channel_id || fetchingYoutube}
                    className="rounded-2xl bg-black px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white disabled:opacity-40"
                  >
                    {fetchingYoutube ? "Loading" : "Fetch"}
                  </button>
                </div>
              </label>

              <LabeledInput
                label="Display Name"
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

              <div className="rounded-2xl border border-black/8 bg-[#f8f8f8] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
                  Logo
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white">
                    {channelDraft.custom_logo ? (
                      <Image
                        src={channelDraft.custom_logo}
                        alt="Channel logo"
                        width={64}
                        height={64}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <Globe className="h-7 w-7 text-black/20" />
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black shadow-sm">
                    <Upload className="h-4 w-4" />
                    {uploadingLogo ? "Uploading" : "Upload Logo"}
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
            <div className="flex justify-end gap-3 border-t border-black/6 px-6 py-5">
              <button
                type="button"
                onClick={() => setChannelModalOpen(false)}
                className="rounded-2xl border border-black/8 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-black/55"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveChannel()}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ff4e45] px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-white"
              >
                <Check className="h-4 w-4" />
                Save Channel
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
    <label className="grid gap-2">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-2xl border border-black/8 bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#ff4e45]"
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
    <label className="grid gap-2">
      <span className="text-[11px] font-black uppercase tracking-[0.18em] text-black/35">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="rounded-2xl border border-black/8 bg-[#f8f8f8] px-4 py-3 text-sm outline-none focus:border-[#ff4e45]"
      />
    </label>
  );
}
