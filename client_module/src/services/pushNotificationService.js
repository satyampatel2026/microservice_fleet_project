import { getToken, onMessage } from "firebase/messaging";
import { getClientMessaging } from "../firebase";

async function saveTokenToBackend(token) {
  const response = await fetch( "http://localhost:5000/api/client/push-token",
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fcm_token: token }),
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success !== true) {
    throw new Error(result.message || "Unable to save notification token.");
  }
}

export async function requestPushPermissionAndGetToken() {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications.");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted.");
  }

  const messaging = await getClientMessaging();

  if (!messaging) {
    throw new Error("Firebase Messaging is not supported in this browser.");
  }
   await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const serviceWorkerRegistration = await navigator.serviceWorker.ready;

if (!serviceWorkerRegistration.active) {
  throw new Error("Notification service worker is not active.");
}

  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration,
  });

  if (!token) {
    throw new Error("Could not get the notification token.");
  }

  await saveTokenToBackend(token);

  return true;
}

export async function listenForForegroundMessages(callback) {
  const messaging = await getClientMessaging();

  if (!messaging) return () => {};

  return onMessage(messaging, callback);
}