import { createClient } from "@/lib/supabase-server";
import CustomersPageClient from "./components/CustomersPageClient";

export const dynamic = "force-dynamic";

interface Customer {
  id: string;
  company_name: string;
  country: string | null;
  website: string | null;
  category: string | null;
  status: string;
  priority: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  source: string | null;
  is_starred: boolean;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; starred?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const status = params.status;
  const starred = params.starred === "1";

  const supabase = await createClient();

  let query = supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (starred) {
    query = query.eq("is_starred", true);
  }

  if (search) {
    query = query.or(
      `company_name.ilike.%${search}%,country.ilike.%${search}%,website.ilike.%${search}%,category.ilike.%${search}%`
    );
  }

  const { data: customers, error } = await query;

  return (
    <CustomersPageClient
      customers={(customers ?? []) as Customer[]}
      error={error?.message ?? null}
      search={search}
      status={status}
    />
  );
}
