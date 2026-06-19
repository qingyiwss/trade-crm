import { createClient } from "@/lib/supabase-server";
import DashboardClient from "./components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { count: totalCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  const { data: allCustomers } = await supabase
    .from("customers")
    .select("status, country");

  const customers = (allCustomers ?? []) as { status: string; country: string }[];

  return (
    <DashboardClient totalCount={totalCount ?? 0} customers={customers} />
  );
}
