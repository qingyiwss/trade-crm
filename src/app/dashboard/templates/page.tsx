"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Mail,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  created_at?: string;
  updated_at?: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function TemplatesPage() {
  const { t } = useI18n();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      } else {
        const data = await res.json();
        addToast("error", data.error || t("templates.loadFailed"));
      }
    } catch {
      addToast("error", t("templates.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  function resetForm() {
    setFormName("");
    setFormSubject("");
    setFormBody("");
    setEditingId(null);
    setShowForm(false);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(tpl: Template) {
    setFormName(tpl.name);
    setFormSubject(tpl.subject);
    setFormBody(tpl.body);
    setEditingId(tpl.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!formName.trim() || !formSubject.trim() || !formBody.trim()) {
      addToast("error", t("templates.fillAllFields"));
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/templates/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            subject: formSubject.trim(),
            body: formBody.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t("templates.saveFailed"));
        }

        setTemplates((prev) =>
          prev.map((tpl) =>
            tpl.id === editingId ? { ...tpl, ...data } : tpl
          )
        );
        addToast("success", t("templates.updated"));
      } else {
        // Create
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formName.trim(),
            subject: formSubject.trim(),
            body: formBody.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || t("templates.saveFailed"));
        }

        setTemplates((prev) => [data, ...prev]);
        addToast("success", t("templates.created"));
      }

      resetForm();
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : t("templates.saveFailed");
      addToast("error", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("templates.confirmDelete"))) return;

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("templates.deleteFailed"));
      }

      setTemplates((prev) => prev.filter((tpl) => tpl.id !== id));
      addToast("success", t("templates.deleted"));
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : t("templates.deleteFailed");
      addToast("error", msg);
    }
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
            {t("templates.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("templates.subtitle")}</p>
        </div>
        <button
          onClick={startCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("templates.newTemplate")}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingId
              ? t("templates.editTemplate")
              : t("templates.createTemplate")}
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {t("templates.templateName")} *
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                placeholder={t("templates.templateNamePlaceholder")}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {t("templates.subject")} *
              </label>
              <input
                type="text"
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
                placeholder={t("templates.subjectPlaceholder")}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                {t("templates.body")} *
              </label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-y font-mono"
                placeholder={t("templates.bodyPlaceholder")}
                required
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("common.saving")}
                  </>
                ) : (
                  t("common.save")
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">{t("templates.noTemplates")}</p>
          <button
            onClick={startCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("templates.createFirst")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
            >
              {/* Row header */}
              <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/70 transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === tpl.id ? null : tpl.id)
                }
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {tpl.name}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {tpl.subject}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(tpl);
                    }}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title={t("common.edit")}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(tpl.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="text-slate-500">
                    {expandedId === tpl.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded body */}
              {expandedId === tpl.id && (
                <div className="px-5 pb-4 border-t border-slate-700/30">
                  <div className="mt-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {t("templates.body")}
                    </p>
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                      {tpl.body}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
