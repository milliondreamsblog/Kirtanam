import { NextResponse } from "next/server";
import { supabaseServer as supabase } from "@/lib/supabase-server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("youtube_channels")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    if (error) throw error;

    return NextResponse.json(
      { channels: data || [] },
      { headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=59" } }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Failed to fetch channels" }, { status: 500 });
  }
}
