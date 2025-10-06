import { verifyMessage } from "ethers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Initialize Supabase client with service role key (server-only)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Missing Supabase environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseServer = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

// GET /api/files?wallet=<walletAddress>&signedMessage=<sig>&message=<optional>
export async function GET(req: Request) {
  try {
    if (!supabaseServer) {
      return NextResponse.json({ message: "Supabase not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || searchParams.get("walletAddress") || "").toString();
    const signedMessage = (searchParams.get("signedMessage") || "").toString();
    const providedMessage = (searchParams.get("message") || "").toString();

    if (!wallet || !signedMessage) {
      return NextResponse.json({ message: "wallet and signedMessage are required" }, { status: 400 });
    }

    // Verify signature
    const message = providedMessage || `I authorize listing for ${wallet}`;
    let recovered: string;
    try {
      recovered = verifyMessage(message, signedMessage);
    } catch (e) {
      return NextResponse.json({ message: "Signature could not be verified" }, { status: 401 });
    }

    if (recovered.toLowerCase() !== wallet.toLowerCase()) {
      return NextResponse.json({ message: "Signature does not match wallet" }, { status: 401 });
    }

    // Query Supabase and map to desired response shape
    const { data, error } = await supabaseServer
      .from("files")
      .select("file_name,cid,created_at")
      .eq("wallet_address", wallet.toLowerCase())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ message: "Failed to query files" }, { status: 500 });
    }

    const items = (data || []).map((row: any) => ({
      fileName: row.file_name,
      CID: row.cid,
      timestamp: row.created_at,
    }));

    return NextResponse.json(items);
  } catch (err: any) {
    console.error("/api/files GET error:", err);
    return NextResponse.json({ message: err?.message || "Failed to fetch files" }, { status: 500 });
  }
}
