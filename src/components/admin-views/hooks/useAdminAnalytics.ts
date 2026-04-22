"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalyticsStats {
  totalDaysActive: number;
  visitorsInView: number;
  avgVisitorsPerDay: number;
  busiestCount: number;
  busiestDate: string;
}

export interface HistoryEntry {
  date: string;
  count: number;
}

export interface DayDetail {
  id: string;
  email: string;
  full_name: string | null;
  visit_date: string;
}

// ---------------------------------------------------------------------------
// Internal response shapes
// ---------------------------------------------------------------------------

interface AnalyticsOverviewResponse {
  stats: AnalyticsStats;
  history: HistoryEntry[];
}

interface AnalyticsDayDetailResponse {
  users: DayDetail[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

async function fetchAnalyticsOverview(
  accessToken: string
): Promise<AnalyticsOverviewResponse> {
  const res = await fetch("/api/admin/analytics", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (body as { error?: string }).error ??
        `HTTP ${res.status}: Failed to fetch analytics`
    );
  }

  return res.json() as Promise<AnalyticsOverviewResponse>;
}

async function fetchAnalyticsDayDetail(
  accessToken: string,
  date: string
): Promise<AnalyticsDayDetailResponse> {
  const res = await fetch(
    `/api/admin/analytics?date=${encodeURIComponent(date)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      (body as { error?: string }).error ??
        `HTTP ${res.status}: Failed to fetch details for ${date}`
    );
  }

  return res.json() as Promise<AnalyticsDayDetailResponse>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminAnalytics(accessToken: string | null) {
  // Tracks which date the user has drilled into (null = none selected)
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // -------------------------------------------------------------------------
  // Main query – aggregated stats + 30-day history
  // -------------------------------------------------------------------------

  const overviewQuery = useQuery<AnalyticsOverviewResponse>({
    queryKey: ["admin-analytics"],
    queryFn: () => fetchAnalyticsOverview(accessToken!),
    staleTime: STALE_TIME,
    enabled: !!accessToken,
  });

  // -------------------------------------------------------------------------
  // Day-detail query – only runs once a date is selected
  // -------------------------------------------------------------------------

  const dayDetailQuery = useQuery<AnalyticsDayDetailResponse>({
    queryKey: ["admin-analytics-day", selectedDate],
    queryFn: () => fetchAnalyticsDayDetail(accessToken!, selectedDate!),
    staleTime: STALE_TIME,
    enabled: !!selectedDate && !!accessToken,
  });

  // -------------------------------------------------------------------------
  // Public action – sets selectedDate, which enables the day-detail query
  // -------------------------------------------------------------------------

  function fetchDayDetail(date: string): void {
    setSelectedDate(date);
  }

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // Overview data
    stats: overviewQuery.data?.stats ?? null,
    history: overviewQuery.data?.history ?? [],
    isLoading: overviewQuery.isLoading,

    // Day-detail drill-down
    fetchDayDetail,
    selectedDate,
    dayDetail: dayDetailQuery.data?.users ?? [],
    isDayDetailLoading: dayDetailQuery.isLoading,
  };
}
