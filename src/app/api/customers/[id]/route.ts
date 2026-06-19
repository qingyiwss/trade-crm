import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("customer_id", id)
    .order("is_primary", { ascending: false });

  if (contactsError) {
    return NextResponse.json({ error: contactsError.message }, { status: 500 });
  }

  const { data: outreachLogs, error: outreachError } = await supabase
    .from("outreach_log")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (outreachError) {
    return NextResponse.json({ error: outreachError.message }, { status: 500 });
  }

  return NextResponse.json({
    ...customer,
    contacts: contacts ?? [],
    outreach_logs: outreachLogs ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const updateData: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const allowedStatuses = ["new", "contacted", "replied", "negotiating", "closed"];
    if (typeof body.status !== "string" || !allowedStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: `status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 }
      );
    }
    updateData.status = body.status;
  }

  if (body.priority !== undefined) {
    const priority = Number(body.priority);
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      return NextResponse.json(
        { error: "priority must be an integer between 1 and 5" },
        { status: 400 }
      );
    }
    updateData.priority = priority;
  }

  if (body.notes !== undefined) {
    if (typeof body.notes !== "string") {
      return NextResponse.json(
        { error: "notes must be a string" },
        { status: 400 }
      );
    }
    updateData.notes = body.notes;
  }

  if (body.is_starred !== undefined) {
    if (typeof body.is_starred !== "boolean") {
      return NextResponse.json(
        { error: "is_starred must be a boolean" },
        { status: 400 }
      );
    }
    updateData.is_starred = body.is_starred;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("customers")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
