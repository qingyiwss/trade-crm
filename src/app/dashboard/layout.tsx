"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  Settings,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" as const },
  { href: "/dashboard/customers", icon: Users, key: "nav.customers" as const },
  { href: "/dashboard/outreach", icon: Send, key: "nav.outreach" as const },
  { href: "/dashboard/settings", icon: Settings, key: "nav.settings" as const },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t, lang, toggleLang } = useI18n();

  return (
    <div className="min-h-screen flex">
      {/* Left sidebar */}
      <aside className="w-60 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-slate-800">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-white tracking-tight"
          >
            TradeCRM
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm font-medium transition-colors border-l-3 ${
                  isActive
                    ? "bg-slate-800 text-white border-l-blue-500"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-l-transparent"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(item.key)}
              </Link>
            );
          })}
        </nav>

        {/* Language toggle */}
        <div className="px-4 py-4 border-t border-slate-800">
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <span
              className={
                lang === "zh" ? "text-blue-400 font-semibold" : ""
              }
            >
              中
            </span>
            <span className="text-slate-600">/</span>
            <span
              className={
                lang === "en" ? "text-blue-400 font-semibold" : ""
              }
            >
              EN
            </span>
          </button>
        </div>
      </aside>

      {/* Right content area */}
      <main className="flex-1 overflow-auto bg-slate-950">{children}</main>
    </div>
  );
}
