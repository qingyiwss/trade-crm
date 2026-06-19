"use client";

import { useState } from "react";
import { Star, X, Save } from "lucide-react";

interface EditCustomerFormProps {
  customerId: string;
  currentStatus: string;
  currentPriority: number;
  currentNotes: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUSES = ["new", "contacted", "replied", "negotiating", "closed"];

export default function EditCustomerForm({
  customerId,
  currentStatus,
  currentPriority,
  currentNotes,
  onClose,
  onSaved,
}: EditCustomerFormProps) {
  const [status, setStatus] = useState(currentStatus);
  const [priority, setPriority] = useState(currentPriority);
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, priority, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-800/70 border border-slate-700/50 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Edit Customer</h2>
        <button
          onClick={onClose}
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

      <div className="space-y-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  status === s
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                    : "bg-slate-700/50 text-slate-400 border-slate-600/30 hover:border-slate-500"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Priority
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setPriority(star)}
                className="p-1 transition-colors"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= priority
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-600"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 resize-y"
            placeholder="Add notes about this customer..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
