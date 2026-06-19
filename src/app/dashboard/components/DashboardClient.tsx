"use client";

import { Users, Sparkles, MessageCircle, Reply } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface StatusCount {
  status: string;
  count: number;
}

interface CountryCount {
  country: string;
  count: number;
}

interface DashboardClientProps {
  totalCount: number;
  customers: { status: string; country: string }[];
}

export default function DashboardClient({
  totalCount: total,
  customers,
}: DashboardClientProps) {
  const { t } = useI18n();

  // Count by status
  const statusMap: Record<string, number> = {
    new: 0,
    contacted: 0,
    replied: 0,
    negotiating: 0,
    closed: 0,
  };

  // Count by country
  const countryMap: Record<string, number> = {};

  for (const c of customers) {
    if (c.status && statusMap.hasOwnProperty(c.status)) {
      statusMap[c.status]++;
    }
    if (c.country) {
      countryMap[c.country] = (countryMap[c.country] || 0) + 1;
    }
  }

  // Sort countries by count descending
  const countryEntries: CountryCount[] = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const maxCountryCount =
    countryEntries.length > 0 ? countryEntries[0].count : 0;

  const metricCards = [
    {
      label: t("dashboard.total"),
      value: total,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("dashboard.new"),
      value: statusMap.new,
      icon: Sparkles,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: t("dashboard.contacted"),
      value: statusMap.contacted,
      icon: MessageCircle,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: t("dashboard.replied"),
      value: statusMap.replied,
      icon: Reply,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
  ];

  const statuses = [
    { label: t("dashboard.negotiating"), value: statusMap.negotiating, color: "bg-purple-500" },
    { label: t("dashboard.closed"), value: statusMap.closed, color: "bg-gray-500" },
  ];

  return (
    <div className="px-4 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("dashboard.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("dashboard.overview")}</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  {card.label}
                </p>
                <p className="text-3xl font-bold text-white mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary statuses + Country distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("dashboard.statusBreakdown")}
          </h2>
          <div className="space-y-3">
            {[
              ...metricCards.slice(1),
              ...statuses.map((s) => ({ label: s.label, value: s.value })),
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className="text-sm font-medium text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4 flex h-2 rounded-full overflow-hidden bg-slate-700">
            {total > 0 && (
              <>
                {statusMap.new > 0 && (
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(statusMap.new / total) * 100}%` }}
                    title={`${t("dashboard.new")}: ${statusMap.new}`}
                  />
                )}
                {statusMap.contacted > 0 && (
                  <div
                    className="bg-yellow-500 h-full transition-all"
                    style={{
                      width: `${(statusMap.contacted / total) * 100}%`,
                    }}
                    title={`${t("dashboard.contacted")}: ${statusMap.contacted}`}
                  />
                )}
                {statusMap.replied > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(statusMap.replied / total) * 100}%` }}
                    title={`${t("dashboard.replied")}: ${statusMap.replied}`}
                  />
                )}
                {statusMap.negotiating > 0 && (
                  <div
                    className="bg-purple-500 h-full transition-all"
                    style={{
                      width: `${(statusMap.negotiating / total) * 100}%`,
                    }}
                    title={`${t("dashboard.negotiating")}: ${statusMap.negotiating}`}
                  />
                )}
                {statusMap.closed > 0 && (
                  <div
                    className="bg-gray-500 h-full transition-all"
                    style={{ width: `${(statusMap.closed / total) * 100}%` }}
                    title={`${t("dashboard.closed")}: ${statusMap.closed}`}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* Country Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("dashboard.countryDistribution")}
          </h2>
          {countryEntries.length === 0 ? (
            <p className="text-sm text-slate-500">{t("dashboard.noData")}</p>
          ) : (
            <div className="space-y-3">
              {countryEntries.map((entry) => (
                <div key={entry.country} className="flex items-center gap-3">
                  <span
                    className="text-sm text-slate-300 w-24 truncate"
                    title={entry.country}
                  >
                    {entry.country}
                  </span>
                  <div className="flex-1 h-5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{
                        width: `${Math.max(
                          (entry.count / maxCountryCount) * 100,
                          4
                        )}%`,
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        {entry.count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
