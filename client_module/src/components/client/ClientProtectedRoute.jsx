import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { checkClientAuth } from "../../services/clientService";

export default function ClientProtectedRoute() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    // Page band ho jaye to purani request state update na kare.
    let cancelled = false;

    async function checkLogin() {
      setLoading(true);
      setError("");

      try {
        await checkClientAuth();
        if (!cancelled) setLoggedIn(true);
      } catch (error) {
        if (cancelled) return;

        if (error.status === 401 || error.status === 403) {
          setLoggedIn(false);
        } else {
          // Server band ho to use logout nahi samajhna.
          setError(error.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkLogin();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  if (loading) {
    return (
      <main role="status" className="flex min-h-screen items-center justify-center bg-[#090b12] text-sm text-white">
        Checking login...
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#090b12] p-6 text-white">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => setRetry(retry + 1)} className="rounded-lg bg-violet-500 px-4 py-2">
          Retry
        </button>
      </main>
    );
  }

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Login sahi hai: protected page dikhao.
  return <Outlet />;
}
