import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");

  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,country.ilike.%${search}%,website.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  const { data, error } = await query;

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

  const { company_name, country, website, category, notes } = body;

  if (!company_name || typeof company_name !== "string" || company_name.trim().length === 0) {
    return NextResponse.json(
      { error: "company_name is required" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    company_name: company_name.trim(),
  };

  if (country && typeof country === "string") insertData.country = country.trim();
  if (website && typeof website === "string") insertData.website = website.trim();
  if (category && typeof category === "string") insertData.category = category.trim();
  if (notes && typeof notes === "string") insertData.notes = notes.trim();

  const { data, error } = await supabase
    .from("customers")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
