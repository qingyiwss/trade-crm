import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const VALID_STAGES = ["new", "sent", "replied", "negotiating", "won", "lost"];

// Stages that represent "contacted" states — when contact moves into one of these, update last_contacted_at
const CONTACTED_STAGES = new Set(["sent", "replied", "negotiating", "won"]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verify contact exists
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, pipeline_stage")
    .eq("id", id)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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

  const { pipeline_stage } = body;

  if (
    !pipeline_stage ||
    typeof pipeline_stage !== "string" ||
    !VALID_STAGES.includes(pipeline_stage)
  ) {
    return NextResponse.json(
      {
        error: `pipeline_stage must be one of: ${VALID_STAGES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {
    pipeline_stage,
  };

  // If moving to a "contacted" state, update last_contacted_at
  if (
    CONTACTED_STAGES.has(pipeline_stage) &&
    contact.pipeline_stage !== pipeline_stage
  ) {
    updateData.last_contacted_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("contacts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
