import { getToken, onMessage } from "firebase/messaging";
import { getPartnerMessaging } from "../firebase";

export async function enablePartnerPush() {
  if (!("Notification" in window)) {
    throw new Error("This browser notifications support nahi karta.");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission allow nahi hui.");
  }

  const messaging = await getPartnerMessaging();
  if (!messaging) {
    throw new Error("Firebase Messaging is browser mein supported nahi hai.");
  }

  await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });

  if (!token) throw new Error("Firebase push token nahi mila.");

  const response = await fetch("http://localhost:5000/api/partner/push-token", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fcm_token: token }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "The push token was not saved in the backend.");
  }
}

export async function listenForPartnerPush(callback) {
  const messaging = await getPartnerMessaging();
  return messaging ? onMessage(messaging, callback) : () => {};
}

