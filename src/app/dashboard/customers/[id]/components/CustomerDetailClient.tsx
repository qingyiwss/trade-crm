"use client";

import { useState, useCallback } from "react";
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
}

interface OutreachLog {
  id: string;
  customer_id: string;
  channel: string | null;
  direction: string | null;
  subject: string | null;
  content: string | null;
  status: string | null;
  created_at: string;
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

  const badgeClasses =
    STATUS_BADGE_CLASSES[customer.status] || STATUS_BADGE_CLASSES["new"];
  const badgeLabelKey =
    STATUS_BADGE_LABELS[customer.status] || STATUS_BADGE_LABELS["new"];

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  function handleSaved() {
    setEditing(false);
    router.refresh();
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
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
            <h1 className="text-2xl font-bold text-white">
              {customer.company_name}
            </h1>
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

      {/* Contacts Section */}
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
            {contacts.map((contact) => (
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
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {clickableLink(contact.email ?? "", "email")}
                  {clickableLink(contact.phone ?? "", "phone")}
                  {clickableLink(contact.whatsapp ?? "", "whatsapp")}
                  {clickableLink(contact.linkedin ?? "", "linkedin")}
                  {clickableLink(contact.instagram ?? "", "instagram")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outreach History Section */}
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
          <div className="space-y-3">
            {outreachLogs.map((log) => {
              const channelIcon =
                CHANNEL_ICON[log.channel ?? ""] ?? null;
              return (
                <div
                  key={log.id}
                  className="bg-slate-800/80 border border-slate-700/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                      {log.subject && (
                        <p className="text-sm font-medium text-white truncate">
                          {log.subject}
                        </p>
                      )}
                      {log.content && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                          {log.content}
                        </p>
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
    </div>
  );
}
