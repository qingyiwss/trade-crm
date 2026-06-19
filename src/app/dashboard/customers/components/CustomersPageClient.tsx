"use client";

import Link from "next/link";
import { Star, ArrowUpRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import CustomerListClient from "./CustomerListClient";

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

interface CustomersPageClientProps {
  customers: Customer[];
  error: string | null;
  search?: string;
  status?: string;
}

const STATUS_BADGE_LABELS: Record<string, string> = {
  new: "customers.statusNew",
  contacted: "customers.statusContacted",
  replied: "customers.statusReplied",
  negotiating: "customers.statusNegotiating",
  closed: "customers.statusClosed",
};

const STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contacted: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  replied: "bg-green-500/10 text-green-400 border-green-500/20",
  negotiating: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function StatusBadge({ status, t }: { status: string; t: (k: string) => string }) {
  const classes = STATUS_BADGE_CLASSES[status] || STATUS_BADGE_CLASSES["new"];
  const labelKey = STATUS_BADGE_LABELS[status] || STATUS_BADGE_LABELS["new"];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes}`}
    >
      {t(labelKey)}
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

function formatDate(dateStr: string, t: (k: string) => string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.yesterday");
  if (diffDays < 7)
    return `${diffDays}${t("common.daysAgo")}`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function CustomersPageClient({
  customers,
  error,
  search,
  status,
}: CustomersPageClientProps) {
  const { t } = useI18n();

  if (error) {
    return (
      <div className="px-4 py-8 flex items-center justify-center min-h-full">
        <div className="text-center">
          <p className="text-red-400 text-lg">{t("customers.loadingFailed")}</p>
          <p className="text-slate-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const count = customers.length;

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("customers.title")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {count}{" "}
            {count !== 1
              ? t("customers.countPlural")
              : t("customers.countSingular")}
            {(search || status) && ` ${t("customers.filtered")}`}
          </p>
        </div>
      </div>

      {/* Client wrapper for filters + modal */}
      <CustomerListClient
        totalCount={count}
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
                  {t("customers.company")}
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                  {t("customers.country")}
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  {t("customers.status")}
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                  {t("customers.priority")}
                </th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                  {t("customers.lastContact")}
                </th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-4 py-3">
                  <span className="sr-only">{t("customers.view")}</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-slate-500 text-sm">
                      {t("customers.noResults")}
                    </p>
                    {(search || status) && (
                      <Link
                        href="/dashboard/customers"
                        className="text-sm text-blue-400 hover:text-blue-300 mt-1 inline-block"
                      >
                        {t("customers.clearFilters")}
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
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
                      <StatusBadge status={customer.status} t={t} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <PriorityStars priority={customer.priority || 3} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-slate-400">
                        {formatDate(customer.updated_at, t)}
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
  );
}
