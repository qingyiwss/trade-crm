"use client";

import Link from "next/link";
import { TrendingUp, Users, Sparkles, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Main hero section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 mb-8">
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-4">
            TradeCRM
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-400 max-w-md mx-auto mb-10">
            {t("landing.subtitle")}
          </p>

          {/* CTA Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors text-base shadow-lg shadow-blue-600/20"
          >
            {t("landing.enterDashboard")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Feature teasers */}
      <footer className="border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 mb-3">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              {t("landing.featureCustomerMgmt")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("landing.featureCustomerDesc")}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-500/10 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              {t("landing.featureOutreach")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("landing.featureOutreachDesc")}
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10 mb-3">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1">
              {t("landing.featureDeals")}
            </h3>
            <p className="text-xs text-slate-500">
              {t("landing.featureDealsDesc")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
