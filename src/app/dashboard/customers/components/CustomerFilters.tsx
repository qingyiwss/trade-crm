"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { Search, Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const STATUS_OPTIONS = [
  { value: "all", key: "customers.statusAll" as const },
  { value: "new", key: "customers.statusNew" as const },
  { value: "contacted", key: "customers.statusContacted" as const },
  { value: "replied", key: "customers.statusReplied" as const },
  { value: "negotiating", key: "customers.statusNegotiating" as const },
  { value: "closed", key: "customers.statusClosed" as const },
];

interface CustomerFiltersProps {
  onAddClick: () => void;
}

export default function CustomerFilters({ onAddClick }: CustomerFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || ""
  );
  const [statusInput, setStatusInput] = useState(
    searchParams.get("status") || "all"
  );

  const updateQuery = useCallback(
    (search: string, status: string) => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (status && status !== "all") params.set("status", status);
      const qs = params.toString();
      router.push(qs ? `/dashboard/customers?${qs}` : "/dashboard/customers");
    },
    [router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      updateQuery(searchInput, statusInput);
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatusInput(newStatus);
    updateQuery(searchInput, newStatus);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder={t("customers.searchPlaceholder")}
          value={searchInput}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
          className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Status filter */}
      <select
        value={statusInput}
        onChange={handleStatusChange}
        className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(opt.key)}
          </option>
        ))}
      </select>

      {/* Add button */}
      <button
        onClick={onAddClick}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
      >
        <Plus className="w-4 h-4" />
        {t("customers.addCustomer")}
      </button>
    </div>
  );
}
