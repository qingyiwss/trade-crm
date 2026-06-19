"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Send,
  Users,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Contact {
  id: string;
  customer_id: string;
  name: string | null;
  email: string | null;
  customer?: {
    id: string;
    company_name: string;
  };
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

interface SelectedRecipient {
  contact: Contact;
  template_id: string;
  custom_subject: string;
  custom_body: string;
}

interface SendResultItem {
  contact_id: string;
  success: boolean;
  error?: string;
}

export default function OutreachPage() {
  const { t } = useI18n();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Multi-recipient state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedRecipients, setSelectedRecipients] = useState<
    Map<string, SelectedRecipient>
  >(new Map());

  // Composer state: global template + subject/body fallback
  const [globalTemplateId, setGlobalTemplateId] = useState<string>("");
  const [globalSubject, setGlobalSubject] = useState("");
  const [globalBody, setGlobalBody] = useState("");

  // UI state
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<SendResultItem[] | null>(null);
  const [showRecipientList, setShowRecipientList] = useState(false);

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

  // Load contacts and templates
  useEffect(() => {
    async function loadData() {
      try {
        const [contactsRes, templatesRes] = await Promise.all([
          fetch("/api/contacts"),
          fetch("/api/templates"),
        ]);
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data);
        } else {
          addToast("error", t("outreach.loadFailed"));
        }
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          setTemplates(data);
        }
      } catch (e) {
        console.error("Failed to load data:", e);
        addToast("error", t("outreach.loadFailed"));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [addToast, t]);

  // When a global template is selected, pre-fill subject and body
  useEffect(() => {
    if (globalTemplateId) {
      const tpl = templates.find((t2) => t2.id === globalTemplateId);
      if (tpl) {
        setGlobalSubject(tpl.subject);
        setGlobalBody(tpl.body);
      }
    }
  }, [globalTemplateId, templates]);

  // Toggle a contact in selection
  function toggleContact(contact: Contact) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(contact.id)) {
        next.delete(contact.id);
        setSelectedRecipients((prevRecips) => {
          const nextRecips = new Map(prevRecips);
          nextRecips.delete(contact.id);
          return nextRecips;
        });
      } else {
        next.add(contact.id);
        // Initialize this recipient with global template/defaults
        setSelectedRecipients((prevRecips) => {
          const nextRecips = new Map(prevRecips);
          if (!nextRecips.has(contact.id)) {
            nextRecips.set(contact.id, {
              contact,
              template_id: globalTemplateId,
              custom_subject: "",
              custom_body: "",
            });
          }
          return nextRecips;
        });
      }
      return next;
    });
  }

  // Update a single recipient's template override
  function updateRecipientTemplate(contactId: string, templateId: string) {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      const existing = next.get(contactId);
      if (existing) {
        const tpl = templates.find((t) => t.id === templateId);
        next.set(contactId, {
          ...existing,
          template_id: templateId,
          custom_subject: tpl ? tpl.subject : existing.custom_subject,
          custom_body: tpl ? tpl.body : existing.custom_body,
        });
      }
      return next;
    });
  }

  // Update per-recipient custom subject
  function updateRecipientSubject(contactId: string, subject: string) {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      const existing = next.get(contactId);
      if (existing) {
        next.set(contactId, { ...existing, custom_subject: subject });
      }
      return next;
    });
  }

  // Update per-recipient custom body
  function updateRecipientBody(contactId: string, body: string) {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      const existing = next.get(contactId);
      if (existing) {
        next.set(contactId, { ...existing, custom_body: body });
      }
      return next;
    });
  }

  // Remove a single recipient
  function removeRecipient(contactId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(contactId);
      return next;
    });
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      next.delete(contactId);
      return next;
    });
  }

  // Select all contacts
  function selectAll() {
    const newIds = new Set<string>();
    const newRecips = new Map<string, SelectedRecipient>();
    for (const c of contacts) {
      newIds.add(c.id);
      newRecips.set(c.id, {
        contact: c,
        template_id: globalTemplateId,
        custom_subject: "",
        custom_body: "",
      });
    }
    setSelectedIds(newIds);
    setSelectedRecipients(newRecips);
  }

  // Deselect all
  function deselectAll() {
    setSelectedIds(new Set());
    setSelectedRecipients(new Map());
  }

  // Apply global template to all selected recipients
  function applyGlobalTemplateToAll() {
    setSelectedRecipients((prev) => {
      const next = new Map(prev);
      for (const [id, recip] of next) {
        next.set(id, {
          ...recip,
          template_id: globalTemplateId,
          custom_subject: "",
          custom_body: "",
        });
      }
      return next;
    });
  }

  // Send all
  async function handleSendAll() {
    if (selectedIds.size === 0) {
      addToast("error", t("outreach.noRecipients"));
      return;
    }

    setSending(true);
    setResults(null);

    const payload = Array.from(selectedRecipients.values()).map((r) => ({
      contact_id: r.contact.id,
      template_id: r.template_id || undefined,
      subject: r.custom_subject || undefined,
      body: r.custom_body || undefined,
    }));

    try {
      const res = await fetch("/api/outreach/send-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients: payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("outreach.failedSend"));
      }

      setResults(data.results || []);

      const successCount =
        data.results?.filter((r: SendResultItem) => r.success).length ?? 0;
      const failCount =
        data.results?.filter((r: SendResultItem) => !r.success).length ?? 0;

      addToast(
        "success",
        t("outreach.batchSent", {
          success: successCount,
          fail: failCount,
          total: data.total,
        })
      );

      // Clear selection if all succeeded
      if (failCount === 0) {
        setSelectedIds(new Set());
        setSelectedRecipients(new Map());
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("outreach.failedSend");
      addToast("error", msg);
    } finally {
      setSending(false);
    }
  }

  // Get contacts with emails
  const contactsWithEmail = contacts.filter((c) => c.email);

  // Get template name by id
  function getTemplateName(id: string) {
    const tpl = templates.find((t) => t.id === id);
    return tpl ? tpl.name : t("outreach.selectTemplate");
  }

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
              {contactsWithEmail.length} {t("outreach.contactsWithEmail")}
            </span>
          </div>
        </div>
      </div>

      {/* Global Template + Subject/Body Composer */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          {t("outreach.globalTemplateConfig")}
        </h2>

        <div className="space-y-4">
          {/* Global Template selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.template")}
            </label>
            <select
              value={globalTemplateId}
              onChange={(e) => setGlobalTemplateId(e.target.value)}
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

          {/* Global Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.subject")}
            </label>
            <input
              type="text"
              value={globalSubject}
              onChange={(e) => setGlobalSubject(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="Email subject..."
            />
          </div>

          {/* Global Body */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              {t("outreach.body")}
            </label>
            <textarea
              value={globalBody}
              onChange={(e) => setGlobalBody(e.target.value)}
              rows={6}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-y font-mono"
              placeholder="Write your email body here..."
            />
          </div>

          {/* Apply to all button */}
          <div>
            <button
              type="button"
              onClick={applyGlobalTemplateToAll}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("outreach.applyToAll")}
            </button>
          </div>
        </div>
      </div>

      {/* Recipient selector */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            {t("outreach.selectRecipients")}{" "}
            <span className="text-sm font-normal text-slate-400">
              ({selectedIds.size}/{contactsWithEmail.length})
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {t("outreach.selectAll")}
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={deselectAll}
              className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              {t("outreach.deselectAll")}
            </button>
            <button
              onClick={() => setShowRecipientList(!showRecipientList)}
              className="ml-2 p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              {showRecipientList ? (
                <ChevronDown className="w-4 h-4 rotate-180" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showRecipientList && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contactsWithEmail.map((contact) => {
              const isSelected = selectedIds.has(contact.id);
              const recipData = selectedRecipients.get(contact.id);

              return (
                <div
                  key={contact.id}
                  className={`border rounded-lg transition-colors ${
                    isSelected
                      ? "border-blue-500/30 bg-blue-500/5"
                      : "border-slate-700/50 bg-slate-900/30"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleContact(contact)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/30 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {contact.name || t("outreach.unknownContact")}
                        </span>
                        {contact.customer && (
                          <span className="text-xs text-slate-500 truncate">
                            {contact.customer.company_name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {contact.email}
                      </div>
                    </div>
                    {isSelected && (
                      <button
                        onClick={() => removeRecipient(contact.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Per-recipient override (only when selected) */}
                  {isSelected && recipData && (
                    <div className="px-4 pb-3 space-y-2 border-t border-slate-700/30 pt-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 shrink-0">
                          {t("outreach.templateOverride")}:
                        </label>
                        <select
                          value={recipData.template_id}
                          onChange={(e) =>
                            updateRecipientTemplate(
                              contact.id,
                              e.target.value
                            )
                          }
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="">
                            {t("outreach.useGlobal")}
                          </option>
                          {templates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={recipData.custom_subject}
                          onChange={(e) =>
                            updateRecipientSubject(
                              contact.id,
                              e.target.value
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                          placeholder={t("outreach.customSubject")}
                        />
                      </div>
                      <div>
                        <textarea
                          value={recipData.custom_body}
                          onChange={(e) =>
                            updateRecipientBody(contact.id, e.target.value)
                          }
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-y font-mono"
                          placeholder={t("outreach.customBody")}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSendAll}
          disabled={sending || selectedIds.size === 0}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {sending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("outreach.sending")}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {t("outreach.sendAll")} ({selectedIds.size})
            </>
          )}
        </button>
      </div>

      {/* Results display */}
      {results && results.length > 0 && (
        <div className="mt-6 bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("outreach.sendResults")}
          </h3>
          <div className="space-y-2">
            {results.map((r) => {
              const contact = contacts.find((c) => c.id === r.contact_id);
              return (
                <div
                  key={r.contact_id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    r.success
                      ? "bg-green-500/10 text-green-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  {r.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span className="font-medium">
                    {contact?.name || contact?.email || r.contact_id}
                  </span>
                  {!r.success && r.error && (
                    <span className="text-slate-400 ml-auto text-xs">
                      {r.error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
