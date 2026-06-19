import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const MASKED_PASSWORD = "••••••••";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("smtp_config")
      .select("*")
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "SMTP config not found" },
        { status: 404 }
      );
    }

    // Mask the password before returning
    if (data.smtp_password) {
      data.smtp_password = MASKED_PASSWORD;
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("GET /api/settings/smtp error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    // Get the single existing row
    const { data: current, error: fetchError } = await supabase
      .from("smtp_config")
      .select("*")
      .limit(1)
      .single();

    if (fetchError || !current) {
      return NextResponse.json(
        { error: "SMTP config not found" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.smtp_host === "string" && body.smtp_host.trim()) {
      updates.smtp_host = body.smtp_host.trim();
    }
    if (typeof body.smtp_port === "number" && body.smtp_port > 0) {
      updates.smtp_port = body.smtp_port;
    }
    if (typeof body.smtp_user === "string") {
      updates.smtp_user = body.smtp_user.trim();
    }
    if (typeof body.from_name === "string") {
      updates.from_name = body.from_name.trim();
    }
    // Only update password if it was provided and is not the masked placeholder
    if (
      typeof body.smtp_password === "string" &&
      body.smtp_password !== "" &&
      body.smtp_password !== MASKED_PASSWORD
    ) {
      updates.smtp_password = body.smtp_password;
    }

    const { data, error } = await supabase
      .from("smtp_config")
      .update(updates)
      .eq("id", current.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mask the password before returning
    if (data.smtp_password) {
      data.smtp_password = MASKED_PASSWORD;
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("PUT /api/settings/smtp error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
