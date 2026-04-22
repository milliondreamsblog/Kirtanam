import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ isBcdb: false });

    const { count, error } = await supabase
      .from("bcdb")
      .select("*", { count: "exact", head: true })
      .or(`email_id.eq.${email},email_address.eq.${email}`)
      .eq("is_deleted", false);

    if (error) throw error;

    return NextResponse.json({ isBcdb: !!count });
  } catch (error: any) {
    console.error("BCDB Check Error:", error.message);
    return NextResponse.json({ isBcdb: false }, { status: 500 });
  }
}
