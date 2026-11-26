
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const commissionUrl = "http://localhost:5000/api/admin/finance/commission";

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to access commission settings");
  }

  return data;
}

export default function FinanceSettings() {
  const [commission, setCommission] = useState("");
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [canViewFinance, setCanViewFinance] = useState(true);

  useEffect(() => {
    async function loadCommission() {
      try {
        const response = await fetch(commissionUrl, {
          credentials: "include",
        });
       if (response.status === 403) {
       setCanViewFinance(false);
        return;
       }
        const data = await readResponse(response);

        setCommission(String(data.commissionPercent));
        setLoaded(true);

      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadCommission();
  }, []);

  async function saveCommission(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(commissionUrl, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commissionPercent: Number(commission),
        }),
      });

      const data = await readResponse(response);
      setCommission(String(data.commissionPercent));
      setMessage(`Commission saved at ${data.commissionPercent}%.`);

    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  }
   if (!canViewFinance || loading) return null;
return (
  <section className="py-4" aria-labelledby="commission-label">
    <form
      onSubmit={saveCommission}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <label
        id="commission-label"
        htmlFor="commission"
        className="text-sm font-medium"
      >
        Platform commission
      </label>

      {loaded && (
        <div className="flex items-center gap-2">
          <div className="flex h-9 items-center rounded-md border border-slate-300 bg-white focus-within:border-violet-500 dark:border-slate-600 dark:bg-slate-800">
            <input
              id="commission"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={commission}
              disabled={saving}
              onChange={(event) => {
                setCommission(event.target.value);
                setMessage("");
              }}
              className="w-20 bg-transparent pl-3 text-sm tabular-nums outline-none"
            />
            <span className="pr-3 text-sm text-slate-500">%</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-md bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </form>

    {error && (
      <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
        {error}
      </p>
    )}

    {message && (
      <p role="status" className="mt-2 text-sm text-green-700 dark:text-green-300">
        {message}
      </p>
    )}
    {loaded && (
  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
  <div>
    <p className="text-sm font-medium">Partner payouts</p>
    <p className="text-xs text-slate-500 dark:text-slate-400">
      Record a transfer or check an earlier entry.
    </p>
  </div>

  <Link
    to="/admin/payouts"
    className="inline-flex items-center rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold !text-white !no-underline hover:bg-violet-800 focus-visible:outline-2 focus-visible:outline-violet-500"
  >
    Open register →
  </Link>
</div>
)}
  </section>
);
}

