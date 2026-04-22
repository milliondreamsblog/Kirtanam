import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    // We only return specific public fields to ensure privacy
    const { data, error } = await supabase
      .from("bcdb")
      .select("legal_name, initiated_name, email_id, contact_no, center, photo_url")
      .eq("is_deleted", false)
      .order("initiated_name", { ascending: true });

    if (error) {
      console.error("Directory API Error:", error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
