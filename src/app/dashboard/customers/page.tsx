import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { Star, ArrowUpRight } from "lucide-react";
import CustomerListClient from "./components/CustomerListClient";

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
}

const STATUS_BADGE: Record<string, { label: string; classes: string }> = {
  new: { label: "New", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  contacted: { label: "Contacted", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  replied: { label: "Replied", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
  negotiating: { label: "Negotiating", classes: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  closed: { label: "Closed", classes: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGE[status] || STATUS_BADGE["new"];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}
    >
      {badge.label}
    </span>
  );
}

function PriorityStars({ priority }: { priority: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= priority
              ? "text-amber-400 fill-amber-400"
              : "text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const search = params.search;
  const status = params.status;

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

  const { data: customers, error } = await query;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Failed to load customers</p>
          <p className="text-slate-500 text-sm mt-2">{error.message}</p>
        </div>
      </div>
    );
  }

  const customerList: Customer[] = (customers ?? []) as Customer[];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors mb-1 inline-block"
            >
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-white">Customers</h1>
            <p className="text-sm text-slate-400 mt-1">
              {customerList.length} customer{customerList.length !== 1 ? "s" : ""}
              {(search || status) && " (filtered)"}
            </p>
          </div>
        </div>

        {/* Client wrapper for filters + modal */}
        <CustomerListClient
          totalCount={customerList.length}
          search={search}
          status={status}
        />

        {/* Table */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    Company
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Country
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Priority
                  </th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    Last Contact
                  </th>
                  <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {customerList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <p className="text-slate-500 text-sm">No customers found</p>
                      {(search || status) && (
                        <Link
                          href="/dashboard/customers"
                          className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
                        >
                          Clear filters
                        </Link>
                      )}
                    </td>
                  </tr>
                ) : (
                  customerList.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-800/80 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                        >
                          {customer.company_name}
                        </Link>
                        {customer.website && (
                          <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">
                            {customer.website}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-slate-300">
                          {customer.country || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PriorityStars priority={customer.priority || 3} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-slate-400">
                          {formatDate(customer.updated_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="inline-flex items-center justify-center p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
