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

  const { name, title, email, phone, whatsapp, linkedin, instagram } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  const insertData: Record<string, unknown> = {
    customer_id: id,
    name: name.trim(),
  };

  if (title && typeof title === "string") insertData.title = title.trim();
  if (email && typeof email === "string") insertData.email = email.trim();
  if (phone && typeof phone === "string") insertData.phone = phone.trim();
  if (whatsapp && typeof whatsapp === "string") insertData.whatsapp = whatsapp.trim();
  if (linkedin && typeof linkedin === "string") insertData.linkedin = linkedin.trim();
  if (instagram && typeof instagram === "string") insertData.instagram = instagram.trim();

  const { data, error } = await supabase
    .from("contacts")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
