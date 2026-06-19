"use client";

import { useState, useEffect, useCallback } from "react";
import { Send, Users, Mail, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Customer {
  id: string;
  company_name: string;
  status: string;
  contacts?: Contact[];
}

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at?: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "intro",
    name: "Introduction",
    subject: "Exploring potential collaboration",
    body: "Hello,\n\nI came across your company and wanted to reach out to explore potential collaboration opportunities.\n\nWould you be available for a brief call this week?\n\nBest regards,",
  },
  {
    id: "follow-up",
    name: "Follow-up",
    subject: "Following up on our previous conversation",
    body: "Hello,\n\nI wanted to follow up on our previous conversation. I'd love to continue the discussion when you have a moment.\n\nLooking forward to hearing from you.\n\nBest regards,",
  },
  {
    id: "partnership",
    name: "Partnership Proposal",
    subject: "Partnership opportunity",
    body: "Hello,\n\nI believe there could be a great partnership opportunity between our companies. I'd love to discuss how we might work together.\n\nLet me know if you're interested in exploring this further.\n\nBest regards,",
  },
];

export default function OutreachPage() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [toEmail, setToEmail] = useState("");
  const [toName, setToName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [sendingBatch, setSendingBatch] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualEmail, setManualEmail] = useState(false);

  const addToast = useCallback(
    (type: "success" | "error", message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t2) => t2.id !== id));
      }, 5000);
    },
    []
  );

  // Load customers
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (e) {
        console.error("Failed to load customers:", e);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  // When customer is selected, load contacts
  useEffect(() => {
    async function loadContacts() {
      if (!selectedCustomerId) return;
      try {
        const res = await fetch(`/api/customers/${selectedCustomerId}/contacts`);
        if (res.ok) {
          const contacts: Contact[] = await res.json();
          const emailContact = contacts.find((c) => c.email);
          if (emailContact) {
            setToEmail(emailContact.email || "");
            setToName(emailContact.name || "");
          }
        }
      } catch (e) {
        console.error("Failed to load contacts:", e);
      }
    }
    loadContacts();
  }, [selectedCustomerId]);

  // When template is selected, pre-fill subject and body
  useEffect(() => {
    if (selectedTemplate) {
      const template = templates.find((t2) => t2.id === selectedTemplate);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    }
  }, [selectedTemplate, templates]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();

    if (!toEmail || !subject.trim() || !body.trim()) {
      addToast("error", t("outreach.fillRequired"));
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/outreach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_id: selectedCustomerId || undefined,
          template_id: selectedTemplate || undefined,
          to_email: toEmail.trim(),
          to_name: toName.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("outreach.failedSend"));
      }

      addToast("success", t("outreach.emailSent"));

      // Clear form
      setSubject("");
      setBody("");
      setSelectedTemplate("");
      setSelectedCustomerId("");
      setToEmail("");
      setToName("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("outreach.failedSend");
      addToast("error", msg);
    } finally {
      setSending(false);
    }
  }

  async function handleSendToAllNew() {
    const newCustomers = customers.filter((c) => c.status === "new");

    if (newCustomers.length === 0) {
      addToast("error", t("outreach.noNewCustomers"));
      return;
    }

    if (!subject.trim() || !body.trim()) {
      addToast("error", t("outreach.fillSubjectBody"));
      return;
    }

    setSendingBatch(true);

    try {
      const res = await fetch("/api/outreach/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_ids: newCustomers.map((c) => c.id),
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("outreach.failedSend"));
      }

      addToast(
        "success",
        t("outreach.batchSent", {
          success: data.success_count,
          fail: data.fail_count,
          total: newCustomers.length,
        })
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("outreach.failedSend");
      addToast("error", msg);
    } finally {
      setSendingBatch(false);
    }
  }

  const newCount = customers.filter((c) => c.status === "new").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-4xl mx-auto">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all animate-in ${
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("outreach.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("outreach.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">
              {newCount} {t("outreach.newCustomer")}
              {newCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Compose Section */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          {t("outreach.composeEmail")}
        </h2>

        <form onSubmit={handleSend} className="space-y-4">
          {/* Customer selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.customerOptional")}
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                if (!e.target.value) {
                  setToEmail("");
                  setToName("");
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            >
              <option value="">{t("outreach.selectCustomer")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* To field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">
                {t("outreach.to")} *
              </label>
              <button
                type="button"
                onClick={() => setManualEmail(!manualEmail)}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                {manualEmail
                  ? t("outreach.useCustomerEmail")
                  : t("outreach.typeManually")}
              </button>
            </div>
            {manualEmail || !selectedCustomerId ? (
              <div className="space-y-2">
                <input
                  type="email"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="recipient@company.com"
                  required
                />
                <input
                  type="text"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                  placeholder="Recipient name (optional)"
                />
              </div>
            ) : (
              <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200">
                {toEmail ? (
                  <span>
                    {toName ? `${toName} <${toEmail}>` : toEmail}
                  </span>
                ) : (
                  <span className="text-slate-500">
                    {t("outreach.selectCustomerOrType")}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Template selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.template")}
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            >
              <option value="">{t("outreach.selectTemplate")}</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.subject")} *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="Email subject..."
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.body")} *
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-y font-mono"
              placeholder="Write your email body here..."
              required
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("outreach.sending")}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {t("outreach.send")}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendToAllNew}
              disabled={sendingBatch || newCount === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {sendingBatch ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("outreach.sendingBatch")}
                </>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  {t("outreach.sendToAllNew")} ({newCount})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
