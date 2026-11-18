import { useCallback, useEffect, useRef,useState } from "react";
import { Bell } from "lucide-react";
import {getClientNotifications,markClientNotificationRead,} from "../../services/notificationService";
import { listenForForegroundMessages,requestPushPermissionAndGetToken } from "../../services/pushNotificationService";

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ClientNotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pushLoading, setPushLoading] = useState(false);
  const [pushMessage, setPushMessage] = useState("");
  const seenNotificationIds = useRef(new Set());
  const panelRef = useRef(null);

  useEffect(() => {
  if (!open) return;

  function handleOutsideClick(event) {
    if (panelRef.current && !panelRef.current.contains(event.target)) {
      setOpen(false);
    }
  }

  document.addEventListener("pointerdown", handleOutsideClick);

  return () => {
    document.removeEventListener("pointerdown", handleOutsideClick);
  };
}, [open]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getClientNotifications();
      const loadedNotifications = result.data?.notifications || [];

     loadedNotifications.forEach((item) => {
    seenNotificationIds.current.add(String(item.notification_id));
    });

setNotifications(loadedNotifications);
setUnreadCount(Number(result.data?.unread_count || 0));
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
  let unsubscribe = () => {};
  let componentClosed = false;

  listenForForegroundMessages((payload) => {
    const notificationId = Number(payload.data?.notificationId);
     const notificationKey = String(notificationId || Date.now());
    if (seenNotificationIds.current.has(notificationKey)) {
  return;
  }

seenNotificationIds.current.add(notificationKey);
    const notification = {
      notification_id: notificationId || Date.now(),
      title: payload.notification?.title || "New notification",
      message: payload.notification?.body || "",
      notification_type: payload.data?.type || "general",
      request_id: payload.data?.requestId
        ? Number(payload.data.requestId)
        : null,
      is_read: 0,
      created_at: new Date().toISOString(),
    };

    setNotifications((current) => {
      if (
        notificationId &&
        current.some((item) => Number(item.notification_id) === notificationId)
      ) {
        return current;
      }

      return [notification, ...current].slice(0, 50);
    });

    setUnreadCount((count) => count + 1);
  })
    .then((stopListening) => {
      if (componentClosed) {
        stopListening();
      } else {
        unsubscribe = stopListening;
      }
    })
    .catch((error) => {
      console.error("Foreground notification listener:", error);
    });

  return () => {
    componentClosed = true;
    unsubscribe();
  };
}, []);

  async function handleMarkRead(item) {
    try {
      await markClientNotificationRead(item.notification_id);

      setNotifications((current) =>
        current.map((notification) =>
          notification.notification_id === item.notification_id
            ? { ...notification, is_read: 1 }
            : notification
        )
      );

      if (Number(item.is_read) === 0) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
    } catch (markError) {
      setError(markError.message);
    }
  }

  async function handleEnablePush() {
    setPushLoading(true);
    setPushMessage("");

    try {
      await requestPushPermissionAndGetToken();
      setPushMessage("Push notifications enabled.");
    } catch (pushError) {
      setPushMessage(pushError.message);
    } finally {
      setPushLoading(false);
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) loadNotifications();
        }}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        className="relative rounded-xl p-2.5 text-gray-400 transition hover:bg-white/5 hover:text-white"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-violet-500 px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <section className="absolute right-0 top-12 z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-white/10 bg-[#171b29] shadow-2xl shadow-black/40">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-white">
                Notifications
              </h2>
              <p className="mt-0.5 text-[11px] text-gray-400">
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="rounded-lg bg-violet-600 px-2.5 py-2 text-[10px] font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {pushLoading ? "Enabling..." : "Enable push"}
            </button>
          </header>

          {pushMessage && (
            <p className="border-b border-white/10 px-4 py-2 text-xs text-violet-200">
              {pushMessage}
            </p>
          )}

          {error && (
            <p role="alert" className="px-4 py-3 text-xs text-red-300">
              {error}
            </p>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-xs text-gray-400">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">
                No notifications yet.
              </p>
            ) : (
              notifications.map((item) => (
                <article
                  key={item.notification_id}
                  className={`border-b border-white/5 px-4 py-3 ${
                    Number(item.is_read) === 0 ? "bg-violet-500/[0.06]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-semibold text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-gray-300">
                        {item.message}
                      </p>
                      <p className="mt-2 text-[10px] text-gray-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>

                    {Number(item.is_read) === 0 && (
                      <button
                        type="button"
                        onClick={() => handleMarkRead(item)}
                        className="shrink-0 text-[10px] font-semibold text-violet-300 hover:text-violet-200"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}