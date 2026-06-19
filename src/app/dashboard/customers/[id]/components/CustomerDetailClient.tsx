"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Star,
  Globe,
  MapPin,
  Tag,
  Calendar,
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  ExternalLink,
  Camera,
  MessageCircle,
  Loader2,
  CheckCircle,
  AlertCircle,
  Search,
  ChevronDown,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import EditCustomerForm from "./EditCustomerForm";
import AddContactForm from "./AddContactForm";
import AddOutreachForm from "./AddOutreachForm";

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

interface Contact {
  id: string;
  customer_id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  is_primary: boolean;
  pipeline_stage: string | null;
  last_contacted_at: string | null;
}

interface OutreachLog {
  id: string;
  customer_id: string;
  contact_id: string | null;
  channel: string | null;
  direction: string | null;
  subject: string | null;
  content: string | null;
  status: string | null;
  created_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface CustomerDetailClientProps {
  customer: Customer;
  contacts: Contact[];
  outreachLogs: OutreachLog[];
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

const SOURCE_BADGE_CLASSES: Record<string, string> = {
  manual: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  search: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  deep_mine: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  b2b: "bg-green-500/10 text-green-400 border-green-500/20",
  linkedin: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
};

const PIPELINE_STAGE_LABELS: Record<string, string> = {
  new: "pipeline.new",
  sent: "pipeline.sent",
  replied: "pipeline.replied",
  negotiating: "pipeline.negotiating",
  won: "pipeline.won",
  lost: "pipeline.lost",
};

const PIPELINE_STAGE_CLASSES: Record<string, string> = {
  new: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  replied: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  negotiating: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  won: "bg-green-500/10 text-green-400 border-green-500/20",
  lost: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PIPELINE_STAGES = ["new", "sent", "replied", "negotiating", "won", "lost"];

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5" />,
  linkedin: <ExternalLink className="w-3.5 h-3.5" />,
  instagram: <Camera className="w-3.5 h-3.5" />,
};

function formatDate(dateStr: string, t: (k: string) => string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.yesterday");
  if (diffDays < 7) return `${diffDays}${t("common.daysAgo")}`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeDate(dateStr: string | null, t: (k: string) => string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("common.today");
  if (diffDays === 1) return t("common.yesterday");
  if (diffDays < 7) return `${diffDays}${t("common.daysAgo")}`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function clickableLink(value: string, type: string): React.ReactNode | null {
  if (!value) return null;

  let href = "";
  let label = value;
  let icon: React.ReactNode = null;

  switch (type) {
    case "email":
      href = `mailto:${value}`;
      icon = <Mail className="w-3.5 h-3.5" />;
      break;
    case "phone":
      href = `tel:${value}`;
      icon = <Phone className="w-3.5 h-3.5" />;
      break;
    case "whatsapp":
      href = `https://wa.me/${value.replace(/[^0-9+]/g, "")}`;
      icon = <MessageCircle className="w-3.5 h-3.5" />;
      break;
    case "linkedin":
      href = value.startsWith("http") ? value : `https://${value}`;
      icon = <ExternalLink className="w-3.5 h-3.5" />;
      break;
    case "instagram":
      href = `https://instagram.com/${value.replace(/^@/, "")}`;
      icon = <Camera className="w-3.5 h-3.5" />;
      break;
    default:
      return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}

export default function CustomerDetailClient({
  customer: initialCustomer,
  contacts: initialContacts,
  outreachLogs: initialOutreachLogs,
}: CustomerDetailClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [outreachLogs, setOutreachLogs] =
    useState<OutreachLog[]>(initialOutreachLogs);
  const [editing, setEditing] = useState(false);
  const [deepMining, setDeepMining] = useState(false);
  const [starring, setStarring] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pipelineUpdating, setPipelineUpdating] = useState<Record<string, boolean>>({});
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t2) => t2.id !== id));
    }, 3000);
  }, []);

  const badgeClasses =
    STATUS_BADGE_CLASSES[customer.status] || STATUS_BADGE_CLASSES["new"];
  const badgeLabelKey =
    STATUS_BADGE_LABELS[customer.status] || STATUS_BADGE_LABELS["new"];

  // Source badge classes — same colors as list page
  const sourceClasses = customer.source
    ? SOURCE_BADGE_CLASSES[customer.source] || SOURCE_BADGE_CLASSES["manual"]
    : "";

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  // ── Star toggle ──────────────────────────────────────────────────
  async function handleToggleStar() {
    setStarring(true);
    const newState = !customer.is_starred;
    // Optimistic update
    setCustomer((prev) => ({ ...prev, is_starred: newState }));
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: newState }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
      addToast("success", newState ? t("customerDetail.star") : t("customerDetail.unstar"));
    } catch (err: unknown) {
      // Revert on error
      setCustomer((prev) => ({ ...prev, is_starred: !newState }));
      const message = err instanceof Error ? err.message : t("common.error");
      addToast("error", message);
    } finally {
      setStarring(false);
    }
  }

  // ── Pipeline stage change ────────────────────────────────────────
  async function handleStageChange(contactId: string, newStage: string) {
    setPipelineUpdating((prev) => ({ ...prev, [contactId]: true }));
    // Optimistic update
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, pipeline_stage: newStage, last_contacted_at: new Date().toISOString() }
          : c
      )
    );
    try {
      const res = await fetch(`/api/contacts/${contactId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_stage: newStage }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed");
      }
    } catch (err: unknown) {
      // Revert — re-fetch would be better but we do local revert
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId
            ? { ...c, pipeline_stage: initialContacts.find((ic) => ic.id === contactId)?.pipeline_stage || null, last_contacted_at: initialContacts.find((ic) => ic.id === contactId)?.last_contacted_at || null }
            : c
        )
      );
      const message = err instanceof Error ? err.message : t("common.error");
      addToast("error", message);
    } finally {
      setPipelineUpdating((prev) => ({ ...prev, [contactId]: false }));
    }
  }

  // ── Thread toggle ────────────────────────────────────────────────
  function toggleThread(contactId: string) {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  }

  function toggleLog(logId: string) {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(logId)) {
        next.delete(logId);
      } else {
        next.add(logId);
      }
      return next;
    });
  }

  // ── Group outreach logs by contact_id for threaded view ──────────
  const threadGroups = useMemo(() => {
    const groups: Record<string, OutreachLog[]> = {};
    const ungrouped: OutreachLog[] = [];

    for (const log of outreachLogs) {
      if (log.contact_id) {
        if (!groups[log.contact_id]) {
          groups[log.contact_id] = [];
        }
        groups[log.contact_id].push(log);
      } else {
        ungrouped.push(log);
      }
    }

    return { groups, ungrouped };
  }, [outreachLogs]);

  // Build a contact lookup map
  const contactMap = useMemo(() => {
    const map: Record<string, Contact> = {};
    for (const c of contacts) {
      map[c.id] = c;
    }
    return map;
  }, [contacts]);

  async function handleDeepMine() {
    setDeepMining(true);
    try {
      const res = await fetch("/api/search/deep-mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: customer.id,
          company_name: customer.company_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed");
      }
      addToast("success", t("prospect.deepMineCreated"));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      addToast("error", message);
    } finally {
      setDeepMining(false);
    }
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {toast.message}
          </div>
        ))}
      </div>

      {/* Back */}
      <Link
        href="/dashboard/customers"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("customerDetail.backToCustomers")}
      </Link>

      {/* Header */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {/* Star toggle button */}
              <button
                onClick={handleToggleStar}
                disabled={starring}
                className="shrink-0 p-0.5 rounded transition-colors hover:bg-slate-700/50 disabled:opacity-50"
                title={customer.is_starred ? t("customerDetail.unstar") : t("customerDetail.star")}
              >
                {starring ? (
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                ) : (
                  <Star
                    className={`w-5 h-5 ${
                      customer.is_starred
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-500"
                    }`}
                  />
                )}
              </button>
              <h1 className="text-2xl font-bold text-white">
                {customer.company_name}
              </h1>
              {/* Source badge */}
              {customer.source && (
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${sourceClasses}`}
                >
                  {customer.source.replace(/_/g, " ")}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses}`}
              >
                {t(badgeLabelKey)}
              </span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (customer.priority || 3)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeepMine}
              disabled={deepMining}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("prospect.deepMineHint")}
            >
              {deepMining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {t("prospect.deepMine")}
            </button>
            <button
              onClick={() => setEditing(!editing)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                editing
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              <Pencil className="w-4 h-4" />
              {editing
                ? t("customerDetail.cancelEdit")
                : t("customerDetail.edit")}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <EditCustomerForm
          customerId={customer.id}
          currentStatus={customer.status}
          currentPriority={customer.priority}
          currentNotes={customer.notes}
          onClose={() => setEditing(false)}
          onSaved={handleSaved}
        />
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Info Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("customerDetail.companyDetails")}
          </h2>
          <div className="space-y-3">
            {customer.country && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-300">
                  {customer.country}
                </span>
              </div>
            )}
            {customer.website && (
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                <a
                  href={customer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 truncate"
                >
                  {customer.website}
                </a>
              </div>
            )}
            {customer.category && (
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-sm text-slate-300">
                  {customer.category}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-400">
                {t("customerDetail.created")}{" "}
                {new Date(customer.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("customerDetail.notes")}
          </h2>
          {customer.notes ? (
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {customer.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-500 italic">
              {t("customerDetail.noNotes")}
            </p>
          )}
        </div>
      </div>

      {/* ── Contacts Section ────────────────────────────────────────── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t("customerDetail.contacts")}
            {contacts.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({contacts.length})
              </span>
            )}
          </h2>
          <AddContactForm customerId={customer.id} onSaved={handleRefresh} />
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            {t("customerDetail.noContacts")}
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => {
              const stage = contact.pipeline_stage || "new";
              const stageClasses =
                PIPELINE_STAGE_CLASSES[stage] || PIPELINE_STAGE_CLASSES["new"];
              const stageLabelKey =
                PIPELINE_STAGE_LABELS[stage] || PIPELINE_STAGE_LABELS["new"];

              return (
                <div
                  key={contact.id}
                  className="bg-slate-800/80 border border-slate-700/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {contact.name}
                        </span>
                        {contact.is_primary && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {t("customerDetail.primary")}
                          </span>
                        )}
                      </div>
                      {contact.title && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {contact.title}
                        </p>
                      )}
                    </div>

                    {/* Pipeline Stage Badge + Dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <div className="relative">
                          {pipelineUpdating[contact.id] ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border border-slate-500/20 bg-slate-500/5 text-slate-400">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              ...
                            </span>
                          ) : (
                            <select
                              value={stage}
                              onChange={(e) =>
                                handleStageChange(contact.id, e.target.value)
                              }
                              className={`appearance-none cursor-pointer inline-flex items-center px-2 py-0.5 pr-5 rounded-full text-[10px] font-medium border outline-none ${stageClasses}`}
                              style={{ background: "transparent" }}
                              title={t(stageLabelKey)}
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s} className="bg-slate-800 text-slate-200">
                                  {t(PIPELINE_STAGE_LABELS[s] || s)}
                                </option>
                              ))}
                            </select>
                          )}
                          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                        {contact.last_contacted_at && (
                          <span className="text-[10px] text-slate-500">
                            {relativeDate(contact.last_contacted_at, t)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Multi-Channel Action Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors"
                        title={t("common.channels.email")}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/[^0-9+]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-green-400 hover:bg-slate-700/50 transition-colors"
                        title={t("common.channels.whatsapp")}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 transition-colors"
                        title={t("common.channels.phone")}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {contact.linkedin && (
                      <a
                        href={
                          contact.linkedin.startsWith("http")
                            ? contact.linkedin
                            : `https://${contact.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
                        title={t("common.channels.linkedin")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {contact.instagram && (
                      <a
                        href={`https://instagram.com/${contact.instagram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-pink-400 hover:bg-slate-700/50 transition-colors"
                        title={t("common.channels.instagram")}
                      >
                        <Camera className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {!contact.email && !contact.whatsapp && !contact.phone && !contact.linkedin && !contact.instagram && (
                      <span className="text-xs text-slate-600 italic">
                        {t("common.noData")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Outreach History Section (Email Thread View) ────────────── */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t("customerDetail.outreachHistory")}
            {outreachLogs.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({outreachLogs.length})
              </span>
            )}
          </h2>
          <AddOutreachForm
            customerId={customer.id}
            onSaved={handleRefresh}
          />
        </div>

        {outreachLogs.length === 0 ? (
          <p className="text-sm text-slate-500 italic">
            {t("customerDetail.noOutreach")}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Threaded conversations grouped by contact */}
            {Object.entries(threadGroups.groups).map(([contactId, logs]) => {
              const contact = contactMap[contactId];
              const contactName = contact?.name || t("common.unknown");
              const isExpanded = expandedThreads.has(contactId);

              return (
                <div
                  key={contactId}
                  className="bg-slate-800/80 border border-slate-700/30 rounded-lg overflow-hidden"
                >
                  {/* Thread header */}
                  <button
                    onClick={() => toggleThread(contactId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-white">
                        {contactName}
                      </span>
                      <span className="text-xs text-slate-500">
                        ({logs.length} {logs.length === 1 ? "message" : "messages"})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {t("customerDetail.emailThread")}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </button>

                  {/* Thread messages */}
                  {isExpanded && (
                    <div className="border-t border-slate-700/30">
                      {/* Sort logs chronologically for thread view */}
                      {[...logs]
                        .sort(
                          (a, b) =>
                            new Date(a.created_at).getTime() -
                            new Date(b.created_at).getTime()
                        )
                        .map((log) => {
                          const isInbound = log.direction === "inbound";
                          const channelIcon =
                            CHANNEL_ICON[log.channel ?? ""] ?? null;
                          const logExpanded = expandedLogs.has(log.id);

                          return (
                            <div
                              key={log.id}
                              className={`px-4 py-3 border-b border-slate-700/20 last:border-b-0 ${
                                isInbound
                                  ? "border-l-4 border-l-green-500 bg-green-500/5"
                                  : "border-l-4 border-l-blue-500 bg-blue-500/5"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  {/* Direction label + channel */}
                                  <div className="flex items-center gap-2 mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                        isInbound
                                          ? "text-green-400"
                                          : "text-blue-400"
                                      }`}
                                    >
                                      {isInbound
                                        ? `← ${t("customerDetail.inbound")}`
                                        : `→ ${t("customerDetail.outbound")}`}
                                    </span>
                                    {channelIcon && (
                                      <span className="text-slate-400">
                                        {channelIcon}
                                      </span>
                                    )}
                                    <span className="text-xs font-medium text-slate-400 uppercase">
                                      {log.channel || t("customerDetail.unknown")}
                                    </span>
                                    {log.status && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                        {log.status}
                                      </span>
                                    )}
                                  </div>

                                  {/* Contact name */}
                                  <span className="text-xs text-slate-500">
                                    {contactName}
                                  </span>

                                  {/* Subject */}
                                  {log.subject && (
                                    <p className="text-sm font-medium text-white truncate mt-0.5">
                                      {log.subject}
                                    </p>
                                  )}

                                  {/* Content preview */}
                                  {log.content && (
                                    <div className="mt-1">
                                      <p
                                        className={`text-sm text-slate-400 ${
                                          logExpanded ? "" : "line-clamp-2"
                                        }`}
                                      >
                                        {log.content}
                                      </p>
                                      {log.content.length > 150 && (
                                        <button
                                          onClick={() => toggleLog(log.id)}
                                          className="text-xs text-blue-400 hover:text-blue-300 mt-0.5"
                                        >
                                          {logExpanded
                                            ? "Show less"
                                            : "View full content"}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-slate-500 shrink-0">
                                  {formatDate(log.created_at, t)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Ungrouped logs (no contact_id) */}
            {threadGroups.ungrouped.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider px-1">
                  {t("customerDetail.unknown")} ({threadGroups.ungrouped.length})
                </p>
                {threadGroups.ungrouped.map((log) => {
                  const isInbound = log.direction === "inbound";
                  const channelIcon =
                    CHANNEL_ICON[log.channel ?? ""] ?? null;
                  const logExpanded = expandedLogs.has(log.id);

                  return (
                    <div
                      key={log.id}
                      className={`bg-slate-800/80 border border-slate-700/30 rounded-lg p-4 ${
                        isInbound
                          ? "border-l-4 border-l-green-500 bg-green-500/5"
                          : "border-l-4 border-l-blue-500 bg-blue-500/5"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium ${
                                isInbound
                                  ? "text-green-400"
                                  : "text-blue-400"
                              }`}
                            >
                              {isInbound
                                ? `← ${t("customerDetail.inbound")}`
                                : `→ ${t("customerDetail.outbound")}`}
                            </span>
                            {channelIcon && (
                              <span className="text-slate-400">
                                {channelIcon}
                              </span>
                            )}
                            <span className="text-xs font-medium text-slate-400 uppercase">
                              {log.channel || t("customerDetail.unknown")}
                            </span>
                            {log.status && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {log.status}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            {t("common.unknown")}
                          </span>
                          {log.subject && (
                            <p className="text-sm font-medium text-white truncate mt-0.5">
                              {log.subject}
                            </p>
                          )}
                          {log.content && (
                            <div className="mt-1">
                              <p
                                className={`text-sm text-slate-400 ${
                                  logExpanded ? "" : "line-clamp-2"
                                }`}
                              >
                                {log.content}
                              </p>
                              {log.content.length > 150 && (
                                <button
                                  onClick={() => toggleLog(log.id)}
                                  className="text-xs text-blue-400 hover:text-blue-300 mt-0.5"
                                >
                                  {logExpanded
                                    ? "Show less"
                                    : "View full content"}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">
                          {formatDate(log.created_at, t)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
