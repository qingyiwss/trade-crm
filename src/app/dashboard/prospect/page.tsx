"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface SearchTask {
  id: string;
  product: string;
  country: string | null;
  status: string;
  results_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  message: string;
}

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  running: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function ProspectPage() {
  const { t } = useI18n();
  const [product, setProduct] = useState("");
  const [country, setCountry] = useState("");
  const [searching, setSearching] = useState(false);
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t2) => t2.id !== id));
    }, 3000);
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/search/tasks");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTasks(data);
    } catch {
      addToast("error", t("common.networkError"));
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product.trim()) return;

    setSearching(true);
    try {
      const res = await fetch("/api/search/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.trim(),
          country: country.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed");
      }
      addToast("success", t("prospect.deepMineCreated"));
      setProduct("");
      setCountry("");
      fetchTasks();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("common.error");
      addToast("error", message);
    } finally {
      setSearching(false);
    }
  };

  const statusLabel = (status: string) => {
    const key = `prospect.${status}` as string;
    return t(key);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
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

      <h1 className="text-2xl font-bold text-white mb-6">
        {t("prospect.title")}
      </h1>

      {/* New Search Form */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t("prospect.newSearch")}
        </h2>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              {t("prospect.product")} *
            </label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder={t("prospect.product")}
              required
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">
              {t("prospect.country")}
            </label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t("prospect.country")}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !product.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {t("prospect.search")}
          </button>
        </form>
      </div>

      {/* Task List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {t("prospect.taskList")}
          </h2>
          <button
            onClick={fetchTasks}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("prospect.refresh")}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-8 text-center">
            {t("common.noData")}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {t("prospect.product")}
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {t("prospect.country")}
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {t("prospect.status")}
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {t("prospect.results")}
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-slate-400 uppercase tracking-wider">
                    {t("prospect.createdAt")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr
                    key={task.id}
                    className="border-b border-slate-700/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-white">{task.product}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {task.country || "-"}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          STATUS_BADGE_CLASSES[task.status] ||
                          STATUS_BADGE_CLASSES["pending"]
                        }`}
                      >
                        {statusLabel(task.status)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {task.results_count ?? "-"}
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(task.created_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
