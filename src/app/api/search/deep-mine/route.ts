import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
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

  const { customer_id, company_name } = body;

  if (
    !customer_id ||
    typeof customer_id !== "string" ||
    customer_id.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "customer_id is required" },
      { status: 400 }
    );
  }

  if (
    !company_name ||
    typeof company_name !== "string" ||
    company_name.trim().length === 0
  ) {
    return NextResponse.json(
      { error: "company_name is required" },
      { status: 400 }
    );
  }

  // Check if a pending or running task already exists for this company
  const { data: existing } = await supabase
    .from("search_tasks")
    .select("id")
    .eq("product", company_name.trim())
    .in("status", ["pending", "running"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "A search task is already pending for this company" },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("search_tasks")
    .insert({
      product: company_name.trim(),
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
