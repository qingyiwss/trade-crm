"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Star } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface CustomerInfo {
  id: string;
  company_name: string;
  country: string | null;
  is_starred: boolean;
}

interface Contact {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  pipeline_stage: string;
  last_contacted_at: string | null;
  customer: CustomerInfo | null;
}

type StageKey = "new" | "sent" | "replied" | "negotiating" | "won" | "lost";

interface PipelineData {
  stages: Record<StageKey, Contact[]>;
}

// ── Stage config ───────────────────────────────────────────────────

const STAGE_KEYS: StageKey[] = [
  "new",
  "sent",
  "replied",
  "negotiating",
  "won",
  "lost",
];

const STAGE_I18N_KEYS: Record<StageKey, string> = {
  new: "pipeline.new",
  sent: "pipeline.sent",
  replied: "pipeline.replied",
  negotiating: "pipeline.negotiating",
  won: "pipeline.won",
  lost: "pipeline.lost",
};

const STAGE_COLORS: Record<StageKey, string> = {
  new: "border-slate-500 bg-slate-500/10",
  sent: "border-blue-500 bg-blue-500/10",
  replied: "border-yellow-500 bg-yellow-500/10",
  negotiating: "border-purple-500 bg-purple-500/10",
  won: "border-green-500 bg-green-500/10",
  lost: "border-red-500 bg-red-500/10",
};

const STAGE_HEADER_COLORS: Record<StageKey, string> = {
  new: "text-slate-300",
  sent: "text-blue-300",
  replied: "text-yellow-300",
  negotiating: "text-purple-300",
  won: "text-green-300",
  lost: "text-red-300",
};

const STAGE_DOT_COLORS: Record<StageKey, string> = {
  new: "bg-slate-400",
  sent: "bg-blue-400",
  replied: "bg-yellow-400",
  negotiating: "bg-purple-400",
  won: "bg-green-400",
  lost: "bg-red-400",
};

const VALID_STAGES: StageKey[] = [
  "new",
  "sent",
  "replied",
  "negotiating",
  "won",
  "lost",
];

// ── Helpers ────────────────────────────────────────────────────────

function relativeDate(dateStr: string | null, t: (key: string) => string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.yesterday");
  return `${diffDays}${t("common.daysAgo")}`;
}

// ── Page Component ─────────────────────────────────────────────────

export default function PipelinePage() {
  const { t } = useI18n();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [starOnly, setStarOnly] = useState(false);

  // Fetch pipeline data
  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/pipeline");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load pipeline");
      }
      const data: PipelineData = await res.json();
      const all: Contact[] = [];
      for (const key of STAGE_KEYS) {
        const stageContacts = data.stages[key] || [];
        for (const c of stageContacts) {
          all.push({ ...c, pipeline_stage: c.pipeline_stage || key });
        }
      }
      setContacts(all);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Stage change handler
  const handleStageChange = useCallback(
    async (contactId: string, newStage: StageKey) => {
      // Optimistic update
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, pipeline_stage: newStage } : c
        )
      );

      try {
        const res = await fetch(`/api/contacts/${contactId}/stage`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipeline_stage: newStage }),
        });
        if (!res.ok) {
          // Revert on failure
          fetchPipeline();
        }
      } catch {
        fetchPipeline();
      }
    },
    [fetchPipeline]
  );

  // Filter and group
  const grouped = useMemo(() => {
    const stages: Record<StageKey, Contact[]> = {
      new: [],
      sent: [],
      replied: [],
      negotiating: [],
      won: [],
      lost: [],
    };

    let filtered = contacts;
    if (starOnly) {
      filtered = contacts.filter((c) => c.customer?.is_starred);
    }

    for (const c of filtered) {
      const stage = (c.pipeline_stage || "new") as StageKey;
      if (stages[stage]) {
        stages[stage].push(c);
      } else {
        stages.new.push(c);
      }
    }

    return stages;
  }, [contacts, starOnly]);

  // ── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-red-400">{error}</p>
        <button
          onClick={fetchPipeline}
          className="px-4 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-white">
          {t("pipeline.title")}
        </h1>
        <button
          onClick={() => setStarOnly((v) => !v)}
          className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
            starOnly
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
              : "bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700"
          }`}
        >
          <Star className={`w-4 h-4 ${starOnly ? "fill-yellow-400 text-yellow-400" : ""}`} />
          {t("pipeline.starOnly")}
        </button>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {STAGE_KEYS.map((stageKey) => {
            const stageContacts = grouped[stageKey];
            return (
              <div
                key={stageKey}
                className={`flex flex-col w-72 shrink-0 rounded-xl border-t-2 ${STAGE_COLORS[stageKey]} bg-slate-900/50`}
              >
                {/* Column header */}
                <div className="px-4 py-3 flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${STAGE_DOT_COLORS[stageKey]}`}
                  />
                  <span
                    className={`text-sm font-semibold ${STAGE_HEADER_COLORS[stageKey]}`}
                  >
                    {t(STAGE_I18N_KEYS[stageKey])}
                  </span>
                  <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                    {stageContacts.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                  {stageContacts.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-8">
                      {t("pipeline.noContacts")}
                    </p>
                  ) : (
                    stageContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="group relative bg-slate-800 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 cursor-pointer transition-colors"
                      >
                        {/* Clickable area - navigate to customer */}
                        <div
                          onClick={() =>
                            router.push(
                              `/dashboard/customers/${contact.customer?.id}`
                            )
                          }
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-white truncate">
                              {contact.name}
                            </p>
                            {contact.customer?.is_starred && (
                              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0 mt-0.5" />
                            )}
                          </div>

                          {contact.customer?.company_name && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {contact.customer.company_name}
                            </p>
                          )}

                          {contact.title && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {contact.title}
                            </p>
                          )}

                          {contact.email && (
                            <p className="text-xs text-slate-500 mt-0.5 truncate">
                              {contact.email}
                            </p>
                          )}

                          <p className="text-xs text-slate-600 mt-1.5">
                            {t("pipeline.lastContacted")}:{" "}
                            {relativeDate(contact.last_contacted_at, t) || "—"}
                          </p>
                        </div>

                        {/* Stage change dropdown */}
                        <div className="mt-2 pt-2 border-t border-slate-700/50">
                          <select
                            value={contact.pipeline_stage || "new"}
                            onChange={(e) =>
                              handleStageChange(
                                contact.id,
                                e.target.value as StageKey
                              )
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs bg-slate-900 text-slate-300 border border-slate-700 rounded-md px-2 py-1.5 focus:outline-none focus:border-slate-500 cursor-pointer"
                          >
                            {VALID_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {t(STAGE_I18N_KEYS[s])}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
