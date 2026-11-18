
import { useState } from "react";
import {
  Send,
  Bell,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { sendBroadcastNotification } from "../../services/adminNotificationService";

export default function SendBroadcastNotificationModal({ onClose }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!title.trim() || !message.trim()) {
      setError("Please enter both title and message.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await sendBroadcastNotification({
        title: title.trim(),
        message: message.trim(),
      });

      const { totalClients, savedCount, failedCount } =
        result.data || {};

      setSuccess(
        `Saved for ${savedCount ?? 0}/${totalClients ?? 0} clients. Failed: ${failedCount ?? 0}.`
      );

      setTitle("");
      setMessage("");
    } catch (sendError) {
      setError(sendError.message || "Unable to send notification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !loading) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#191e2d]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <Bell size={16} />
            </div>

            <h3 className="whitespace-nowrap text-sm font-semibold text-slate-800 dark:text-white">
              Broadcast Notification
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-3 p-4">
          <div>
            <div className="mb-1 flex justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Notification Title
              </label>
              <span className="text-[10px] text-slate-400">
                {title.length}/150
              </span>
            </div>

            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              maxLength={150}
              required
              disabled={loading}
              placeholder="Enter title"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Notification Message
              </label>
              <span className="text-[10px] text-slate-400">
                {message.length}/1000
              </span>
            </div>

            <textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError("");
              }}
              maxLength={1000}
              rows={3}
              required
              disabled={loading}
              placeholder="Write your message..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400"
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Bell size={12} />
            All Clients
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={13} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
