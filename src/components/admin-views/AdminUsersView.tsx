"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import {
  ROLE_COLORS,
  ROLE_NAMES,
  type User,
  useAdminUsers,
} from "./hooks/useAdminUsers";

interface AdminUsersViewProps {
  accessToken: string | null;
  currentUserId?: string;
  onBack: () => void;
}

function generatePagination(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  if (currentPage <= 4) return [1, 2, 3, 4, 5, "...", totalPages];
  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }
  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}

export default function AdminUsersView({
  accessToken,
  currentUserId,
  onBack,
}: AdminUsersViewProps) {
  const { users, isLoading, updateRole, deleteUser } = useAdminUsers(accessToken);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<number | "all">("all");
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [userViewMode, setUserViewMode] = useState<"list" | "grid">("list");

  const filteredUsers = useMemo(() => {
    const s = userSearch.toLowerCase();
    return users.filter((u) => {
      const matchesSearch =
        u.email?.toLowerCase().includes(s) ||
        u.full_name?.toLowerCase().includes(s) ||
        u.temple?.toLowerCase().includes(s) ||
        u.mobile?.toLowerCase().includes(s);
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [roleFilter, userSearch, users]);

  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / Math.max(1, usersPerPage))
  );
  const safePage = Math.min(userPage, totalUserPages);
  const paginatedUsers = filteredUsers.slice(
    (safePage - 1) * usersPerPage,
    safePage * usersPerPage
  );

  const stats = useMemo(
    () => [
      { label: "Total Members", count: users.length, icon: Users, color: "bg-indigo-600" },
      {
        label: "Super Admins",
        count: users.filter((u) => u.role === 1).length,
        icon: Shield,
        color: "bg-red-600",
      },
      {
        label: "Video Uploaders",
        count: users.filter((u) => u.role === 2).length,
        icon: Upload,
        color: "bg-[#7A8F78]",
      },
      {
        label: "Managers",
        count: users.filter((u) => u.role === 5).length,
        icon: UserCheck,
        color: "bg-emerald-600",
      },
    ],
    [users]
  );

  const renderRoleSelect = (u: User) => (
    <select
      value={u.role}
      disabled={u.id === currentUserId}
      onChange={(e) => updateRole(u.id, Number(e.target.value))}
      className="bg-white border-2 border-slate-300 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:border-blue-400 focus:border-blue-500 transition-all shadow-sm disabled:opacity-50"
    >
      {Object.entries(ROLE_NAMES).map(([id, name]) => (
        <option key={id} value={id}>
          {name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-devo-600 font-black uppercase tracking-widest text-xs hover:gap-3 transition-all"
      >
        <ArrowRight className="w-4 h-4 rotate-180" /> Back to Dashboard
      </button>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-300 flex flex-col items-center text-center space-y-2"
          >
            <div
              className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center text-white shadow-lg`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <h4 className="text-2xl font-black text-devo-950">{stat.count}</h4>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border border-slate-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <h2 className="text-3xl font-outfit font-black text-devo-950 flex items-center gap-4">
            <Users className="w-8 h-8 text-blue-600" /> Member Access
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-3 h-4 w-4 text-slate-300" />
              <input
                type="text"
                placeholder="Find member..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl focus:bg-white focus:border-blue-400 outline-none transition-all text-sm font-bold"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value === "all" ? "all" : Number(e.target.value));
                setUserPage(1);
              }}
              className="bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest focus:bg-white focus:border-blue-400 outline-none"
            >
              <option value="all">Every Role</option>
              {Object.entries(ROLE_NAMES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setUserViewMode("list")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  userViewMode === "list"
                    ? "bg-white text-devo-950 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <List className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => setUserViewMode("grid")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  userViewMode === "grid"
                    ? "bg-white text-devo-950 shadow-sm border border-slate-200/50"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <LayoutGrid className="w-4 h-4" /> Grid
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="hidden lg:table w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="px-6 pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Member Profile
                  </th>
                  <th className="px-6 pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Access Credentials
                  </th>
                  <th className="px-6 pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Authority Level
                  </th>
                  <th className="px-6 pb-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">
                    Settings
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-100" />
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-20 text-center font-bold text-slate-300">
                      No members match search
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => (
                    <tr key={u.id} className="group hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-6 font-bold text-slate-600 text-sm">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg ${
                              u.role === 1 ? "bg-red-500" : "bg-devo-600"
                            }`}
                          >
                            {u.full_name
                              ? u.full_name[0].toUpperCase()
                              : u.email?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-devo-950 text-base leading-none mb-1">
                              {u.full_name || "Incomplete Profile"}
                            </p>
                            <p className="text-[11px] font-bold text-devo-600 uppercase tracking-widest">
                              {u.temple || "No Center"}
                            </p>
                            <p className="text-[10px] font-medium text-slate-400 mt-1">
                              {u.mobile || "No Mobile"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 font-bold text-slate-600 text-sm">
                        {u.email}
                        <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-tighter">
                          Joined: {new Date(u.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${
                            ROLE_COLORS[u.role] || "bg-slate-50"
                          }`}
                        >
                          {ROLE_NAMES[u.role] || "Member"}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {renderRoleSelect(u)}
                          {u.id !== currentUserId && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-3 text-red-500 hover:text-white border-2 border-slate-300 hover:bg-red-600 rounded-xl transition-all shadow-sm"
                              title="Delete User Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden mt-4">
            {isLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-100" />
              </div>
            ) : paginatedUsers.length === 0 ? (
              <div className="py-20 text-center font-bold text-slate-300">No members match search</div>
            ) : userViewMode === "list" ? (
              <div className="flex flex-col gap-2">
                {paginatedUsers.map((u) => (
                  <div
                    key={`mobile-user-list-${u.id}`}
                    className="flex flex-col gap-3 p-3.5 bg-white border-2 border-slate-300 rounded-2xl shadow-sm relative group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-devo-950 text-sm leading-tight truncate">
                          {u.full_name || "Incomplete Profile"}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 truncate mt-0.5">{u.email}</p>
                      </div>
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border-2 border-transparent active:border-red-100 rounded-xl transition-all"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                      {renderRoleSelect(u)}
                      <div className="bg-blue-50 border border-blue-100 px-2 py-1.5 rounded-lg text-[10px] font-black uppercase text-devo-600 truncate max-w-[120px]">
                        {u.temple || "No Center"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {paginatedUsers.map((u) => (
                  <div
                    key={`mobile-user-card-${u.id}`}
                    className="flex flex-col gap-4 p-5 bg-white border-2 border-slate-300 rounded-2xl shadow-sm relative"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-md flex-shrink-0 ${
                          u.role === 1 ? "bg-red-500" : "bg-devo-600"
                        }`}
                      >
                        {u.full_name ? u.full_name[0].toUpperCase() : u.email?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-devo-950 text-lg leading-tight truncate">
                          {u.full_name || "Incomplete Profile"}
                        </h3>
                        <p className="text-sm font-bold text-slate-500 truncate mt-0.5">{u.email}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${
                              ROLE_COLORS[u.role] || "bg-slate-50"
                            }`}
                          >
                            {ROLE_NAMES[u.role] || "Member"}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-devo-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                            {u.temple || "No Center"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-200 mt-0 flex flex-col sm:flex-row gap-2">
                      {renderRoleSelect(u)}
                      {u.id !== currentUserId && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="p-3 bg-white text-red-500 hover:text-white border-2 border-slate-300 hover:border-red-600 hover:bg-red-600 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 font-bold"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="sm:hidden">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Rows per page:
            </span>
            <select
              value={usersPerPage}
              onChange={(e) => {
                setUsersPerPage(Number(e.target.value));
                setUserPage(1);
              }}
              className="bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:border-blue-400 transition-all"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            {generatePagination(safePage, totalUserPages).map((p, i) =>
              typeof p === "number" ? (
                <button
                  key={i}
                  onClick={() => setUserPage(p)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all border-2 ${
                    safePage === p
                      ? "bg-devo-950 text-white border-devo-950 shadow-lg"
                      : "border-slate-300 bg-white hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={i} className="px-1 text-slate-300 font-bold">
                  ...
                </span>
              )
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              disabled={safePage === 1}
              onClick={() => setUserPage((p) => Math.max(1, p - 1))}
              className="p-3 rounded-2xl bg-white border-2 border-slate-300 text-devo-600 disabled:opacity-30 disabled:pointer-events-none hover:border-devo-400 transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              disabled={safePage >= totalUserPages}
              onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
              className="p-3 rounded-2xl bg-white border-2 border-slate-300 text-devo-600 disabled:opacity-30 disabled:pointer-events-none hover:border-devo-400 transition-all shadow-sm"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
