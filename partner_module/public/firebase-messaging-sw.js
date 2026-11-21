importScripts(
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyD7ncPp0ngj3UfSF0mROgRXJIIPKKAexBM",
  authDomain: "fleet-management-f697d.firebaseapp.com",
  projectId: "fleet-management-f697d",
  storageBucket: "fleet-management-f697d.firebasestorage.app",
  messagingSenderId: "402359655260",
  appId: "1:402359655260:web:4972046b8982f848aa3f99",
});

firebase.messaging();