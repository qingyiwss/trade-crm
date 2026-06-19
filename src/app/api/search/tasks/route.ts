import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("search_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

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

  const { product, country } = body;

  if (!product || typeof product !== "string" || product.trim().length === 0) {
    return NextResponse.json(
      { error: "product is required" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    product: product.trim(),
    status: "pending",
  };

  if (country && typeof country === "string") {
    insertData.country = country.trim();
  }

  const { data, error } = await supabase
    .from("search_tasks")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
