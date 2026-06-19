import { createClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import CustomerDetailClient from "./components/CustomerDetailClient";

export const dynamic = "force-dynamic";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: customer, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !customer) {
    notFound();
  }

  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("customer_id", id)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (contactsError) {
    console.error("Failed to load contacts:", contactsError.message);
  }

  const { data: outreachLogs, error: outreachError } = await supabase
    .from("outreach_log")
    .select("*")
    .eq("customer_id", id)
    .order("created_at", { ascending: false });

  if (outreachError) {
    console.error("Failed to load outreach logs:", outreachError.message);
  }

  return (
    <CustomerDetailClient
      customer={customer}
      contacts={(contacts ?? []) as any[]}
      outreachLogs={(outreachLogs ?? []) as any[]}
    />
  );
}
