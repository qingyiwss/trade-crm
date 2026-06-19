"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SmtpConfig {
  id: string;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_name: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function SettingsPage() {
  const { t } = useI18n();

  const [config, setConfig] = useState<SmtpConfig | null>(null);
  const [host, setHost] = useState("smtp.gmail.com");
  const [port, setPort] = useState(587);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [fromName, setFromName] = useState("Lao Wei");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  // Load current config on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("/api/settings/smtp");

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await res.text();
          console.error(
            "Non-JSON response from /api/settings/smtp:",
            res.status,
            text.slice(0, 200)
          );
          throw new Error(`Server returned ${res.status} ${res.statusText}`);
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Failed to load settings (${res.status})`);
        }

        setConfig(data);
        setHost(data.smtp_host || "smtp.gmail.com");
        setPort(data.smtp_port || 587);
        setUser(data.smtp_user || "");
        setPassword(data.smtp_password || "");
        setFromName(data.from_name || "Lao Wei");
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : t("settings.loadFailed");
        console.error("Failed to load SMTP config:", e);
        addToast("error", msg);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, [addToast, t]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!host.trim()) {
      addToast("error", t("settings.hostRequired"));
      return;
    }
    if (!user.trim()) {
      addToast("error", t("settings.userRequired"));
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/settings/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: host.trim(),
          smtp_port: port,
          smtp_user: user.trim(),
          smtp_password: password,
          from_name: fromName.trim() || "Lao Wei",
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error(
          "Non-JSON response from PUT /api/settings/smtp:",
          res.status,
          text.slice(0, 200)
        );
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("settings.saveFailed"));
      }

      setConfig(data);
      setPassword(data.smtp_password || "");
      addToast("success", t("settings.saved"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("settings.saveFailed");
      addToast("error", msg);
    } finally {
      setSaving(false);
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
    <div className="px-4 py-8 max-w-2xl mx-auto">
      {/* Toast container */}
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

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {t("settings.title")}
          </h1>
          <p className="text-slate-400 mt-1">{t("settings.subtitle")}</p>
        </div>
      </div>

      {/* SMTP Configuration Form */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          {t("settings.smtpConfig")}
        </h2>

        <form onSubmit={handleSave} className="space-y-4">
          {/* SMTP Host */}
          <div>
            <label
              htmlFor="smtp_host"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              {t("settings.smtpHost")} *
            </label>
            <input
              id="smtp_host"
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="smtp.gmail.com"
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("settings.smtpHostDefault")}
            </p>
          </div>

          {/* SMTP Port */}
          <div>
            <label
              htmlFor="smtp_port"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              {t("settings.smtpPort")} *
            </label>
            <input
              id="smtp_port"
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="587"
              min={1}
              max={65535}
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("settings.smtpPortDefault")}
            </p>
          </div>

          {/* SMTP User (Email) */}
          <div>
            <label
              htmlFor="smtp_user"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              {t("settings.smtpUser")} *
            </label>
            <input
              id="smtp_user"
              type="email"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="you@gmail.com"
              required
            />
          </div>

          {/* App Password */}
          <div>
            <label
              htmlFor="smtp_password"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              {t("settings.appPassword")}
            </label>
            <input
              id="smtp_password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="Leave unchanged to keep current password"
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("settings.appPasswordHint")}. {t("settings.appPasswordGmail")}
            </p>
          </div>

          {/* From Name */}
          <div>
            <label
              htmlFor="from_name"
              className="block text-xs font-medium text-slate-400 mb-1.5"
            >
              {t("settings.fromName")}
            </label>
            <input
              id="from_name"
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
              placeholder="Lao Wei"
            />
            <p className="text-xs text-slate-500 mt-1">
              {t("settings.fromNameHint")}
            </p>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("settings.saving")}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t("settings.saveSettings")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
