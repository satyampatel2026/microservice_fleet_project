import { useOutletContext } from "react-router-dom";
import FinanceSettings from "./FinanceSettings";

export default function AdminSettings() {
  const { dark, setDark } = useOutletContext();

  return (
    <div className="mx-auto max-w-3xl text-slate-900 dark:text-slate-100">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">
        Settings
      </h1>

      <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-white/10 dark:border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-3 py-4">
          <label htmlFor="admin-theme" className="text-sm font-medium">
            Display theme
          </label>

          <select
            id="admin-theme"
            value={dark ? "dark" : "light"}
            onChange={(event) => setDark(event.target.value === "dark")}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-violet-500 dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="light">Light mode</option>
            <option value="dark">Dark mode</option>
          </select>
        </div>

        <FinanceSettings />
      </div>
    </div>
  );
}