"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface AddOutreachFormProps {
  customerId: string;
  onSaved: () => void;
}

const CHANNELS = ["email", "whatsapp", "linkedin", "phone", "instagram", "other"];

export default function AddOutreachForm({ customerId, onSaved }: AddOutreachFormProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("email");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("sent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/customers/${customerId}/outreach`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          subject: subject.trim() || undefined,
          content: content.trim() || undefined,
          status: status.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t("addOutreach.failed"));
      }

      setSubject("");
      setContent("");
      setChannel("email");
      setStatus("sent");
      setOpen(false);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("addOutreach.failed"));
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm text-white rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t("addOutreach.log")}
      </button>
    );
  }

  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">
          {t("addOutreach.title")}
        </h3>
        <button
          onClick={() => setOpen(false)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Channel */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t("addOutreach.channel")} *
            </label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            >
              {CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              {t("addOutreach.status")}
            </label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="sent / replied / bounced"
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            {t("addOutreach.subject")}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            placeholder={t("addOutreach.subject")}
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            {t("addOutreach.content")}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-y"
            placeholder={t("addOutreach.content")}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? t("addOutreach.saving") : t("addOutreach.log")}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            {t("addOutreach.cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
