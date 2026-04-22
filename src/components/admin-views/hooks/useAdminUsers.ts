"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Exported Interface ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  mobile: string | null;
  temple: string | null;
  role: number;
  created_at: string;
  updated_at: string;
}

// ── Exported Constants ─────────────────────────────────────────────────────────

export const ROLE_NAMES: Record<number, string> = {
  1: "Super Admin",
  2: "Video Uploader",
  3: "Attendance Incharge",
  4: "BC Access",
  5: "Manager",
  6: "Viewer",
};

export const ROLE_COLORS: Record<number, string> = {
  1: "bg-red-50 text-red-700 border-red-100",
  2: "bg-orange-50 text-orange-700 border-orange-100",
  3: "bg-blue-50 text-blue-700 border-blue-100",
  4: "bg-emerald-50 text-emerald-700 border-emerald-100",
  5: "bg-purple-50 text-purple-700 border-purple-100",
  6: "bg-slate-50 text-slate-700 border-slate-100",
};

// ── Internal Types ─────────────────────────────────────────────────────────────

/** Shape of the `GET /api/admin/users` response. */
interface UsersApiResponse {
  profiles: User[];
}

/** Variables passed to the update-role mutation. */
interface UpdateRoleVariables {
  targetUserId: string;
  newRole: number;
}

/** Shape of the `PATCH /api/admin/users` success response. */
interface UpdateRoleResponse {
  success: true;
}

// ── Query Key ──────────────────────────────────────────────────────────────────

/** Stable, narrowly-typed query key for the admin users list. */
const QUERY_KEY = ["admin-users"] as const;

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * Manages the Users view of the admin panel via TanStack Query v5.
 *
 * **Data fetching**
 * Issues a `GET /api/admin/users` request and exposes the result as `users`.
 * `staleTime` is set to `0` so the admin always sees freshly-fetched data on
 * every mount. The query is disabled entirely until a valid `accessToken` is
 * available.
 *
 * **Mutations**
 * - `updateRole(userId, newRole)` — `PATCH /api/admin/users` with
 *   `{ targetUserId, newRole }`. Invalidates the query on success.
 * - `deleteUser(userId)` — `DELETE /api/admin/users?id=<id>` after a
 *   `window.confirm` guard. Invalidates the query on success.
 *
 * All requests carry an `Authorization: Bearer <accessToken>` header.
 *
 * @param accessToken - Supabase session access token, or `null` while the
 *   session has not yet been resolved.
 *
 * @returns An object containing:
 *   - `users`       — the full, typed list of platform profiles (default `[]`)
 *   - `isLoading`   — `true` while the initial fetch is in-flight
 *   - `updateRole`  — fire-and-forget role-patch helper
 *   - `deleteUser`  — guarded permanent-delete helper
 *
 * @example
 * ```tsx
 * const { users, isLoading, updateRole, deleteUser } = useAdminUsers(session?.access_token ?? null);
 * ```
 */
export function useAdminUsers(accessToken: string | null) {
  const queryClient = useQueryClient();

  // ── GET /api/admin/users ────────────────────────────────────────────────

  const { data, isLoading } = useQuery<UsersApiResponse, Error>({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<UsersApiResponse> => {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch users: ${response.status} ${response.statusText}`
        );
      }

      return response.json() as Promise<UsersApiResponse>;
    },
    staleTime: 0,
    enabled: !!accessToken,
  });

  // ── PATCH /api/admin/users ──────────────────────────────────────────────

  const updateRoleMutation = useMutation<
    UpdateRoleResponse,
    Error,
    UpdateRoleVariables
  >({
    mutationFn: async ({
      targetUserId,
      newRole,
    }: UpdateRoleVariables): Promise<UpdateRoleResponse> => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetUserId, newRole }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update role: ${response.status} ${response.statusText}`
        );
      }

      return response.json() as Promise<UpdateRoleResponse>;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // ── DELETE /api/admin/users?id=<id> ────────────────────────────────────

  const deleteUserMutation = useMutation<void, Error, string>({
    mutationFn: async (userId: string): Promise<void> => {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to delete user: ${response.status} ${response.statusText}`
        );
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Patches `userId`'s role to `newRole`.
   * Triggers a query invalidation on success so the table refreshes automatically.
   */
  const updateRole = (userId: string, newRole: number): void => {
    updateRoleMutation.mutate({ targetUserId: userId, newRole });
  };

  /**
   * Prompts the admin with a `window.confirm` dialog before permanently
   * deleting `userId` and their account.
   * Triggers a query invalidation on success so the table refreshes automatically.
   */
  const deleteUser = (userId: string): void => {
    if (
      !window.confirm(
        "DANGER: This will permanently delete this user and their account. Continue?"
      )
    ) {
      return;
    }

    deleteUserMutation.mutate(userId);
  };

  // ── Return ──────────────────────────────────────────────────────────────

  return {
    users: data?.profiles ?? [],
    isLoading,
    updateRole,
    deleteUser,
  } as const;
}
