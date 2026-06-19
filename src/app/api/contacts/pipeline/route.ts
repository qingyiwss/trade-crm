import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("contacts")
      .select(`
        id,
        name,
        title,
        email,
        phone,
        whatsapp,
        linkedin,
        instagram,
        pipeline_stage,
        last_contacted_at,
        customer:customers (
          id,
          company_name,
          country,
          is_starred
        )
      `)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contacts = ((data ?? []) as unknown as Array<{
      id: string;
      name: string;
      title: string | null;
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      linkedin: string | null;
      instagram: string | null;
      pipeline_stage: string | null;
      last_contacted_at: string | null;
      customer: Array<{
        id: string;
        company_name: string;
        country: string | null;
        is_starred: boolean;
      }> | null;
    }>).map(({ customer, ...rest }) => ({
      ...rest,
      customer: customer?.[0] ?? null,
    }));

    const stages: Record<string, typeof contacts> = {
      new: [],
      sent: [],
      replied: [],
      negotiating: [],
      won: [],
      lost: [],
    };

    for (const contact of contacts) {
      const stage = contact.pipeline_stage || "new";
      if (stages[stage]) {
        stages[stage].push(contact);
      } else {
        // If an unknown stage exists, default to "new"
        stages["new"].push(contact);
      }
    }

    return NextResponse.json({ stages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
