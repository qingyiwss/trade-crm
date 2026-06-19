import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify customer exists
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id")
    .eq("id", id)
    .single();

  if (customerError || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { channel, subject, content, status } = body;

  if (!channel || typeof channel !== "string" || channel.trim().length === 0) {
    return NextResponse.json(
      { error: "channel is required" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    customer_id: id,
    channel: channel.trim(),
    direction: "outbound",
  };

  if (subject && typeof subject === "string") insertData.subject = subject.trim();
  if (content && typeof content === "string") insertData.content = content.trim();
  if (status && typeof status === "string") insertData.status = status.trim();

  const { data, error } = await supabase
    .from("outreach_log")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
