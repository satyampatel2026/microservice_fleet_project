import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Navigation, Square } from "lucide-react";
import { startTracking, stopTracking, sendLocation } from "../services/trackingService";

function getLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

function locationMessage(error) {
  if (error.code === 1) return "Location permission allow karo, phir dobara try karo.";
  if (error.code === 2) return "Location nahi mil rahi. Mobile location/GPS on karo.";
  if (error.code === 3) return "Location lene mein timeout hua. Dobara try karo.";
  return error.message || "Unable to update location";
}

export default function MobileTracking() {
  const { sessionId } = useParams();
  const token = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
  const validLink = /^[a-f0-9]{24}$/i.test(sessionId || "") && /^[a-f0-9]{64}$/.test(token);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [latest, setLatest] = useState(null);
  const timer = useRef(null);
  const sharing = useRef(false);
  const sending = useRef(false);
  const mounted = useRef(false);
  const operation = useRef(0);

  function stopLocalUpdates() {
    sharing.current = false;
    clearInterval(timer.current);
    timer.current = null;
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      operation.current += 1;
      stopLocalUpdates();
    };
  }, [sessionId, token]);

  async function uploadPosition(position) {
    const result = await sendLocation(sessionId, token, {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
    if (mounted.current && sharing.current) {
      setLatest(result.data.latestLocation);
      setError("");
      setStatus("Sharing location");
    }
  }

  async function updatePosition() {
    if (!sharing.current || sending.current) return;
    sending.current = true;
    try {
      const position = await getLocation();
      if (sharing.current) await uploadPosition(position);
    } catch (err) {
      if (!mounted.current || !sharing.current) return;
      setError(locationMessage(err));
      setStatus("Location update failed");
      if ([401, 403, 404, 409, 410].includes(err.status) || err.code === 1) {
        stopLocalUpdates();
      }
    } finally {
      sending.current = false;
    }
  }

  async function beginSharing(resume = false) {
    if (!window.isSecureContext || !navigator.geolocation) {
      setError("Location ke liye HTTPS page ya localhost aur supported browser chahiye.");
      return;
    }
    const currentOperation = ++operation.current;
    setBusy(true);
    setError("");
    try {
      // Permission pehle lo, taki permission deny ho to server session start na ho.
      const position = await getLocation();
      if (!mounted.current || currentOperation !== operation.current) return;
      if (!resume) await startTracking(sessionId, token);
      if (!mounted.current || currentOperation !== operation.current) return;
      sharing.current = true;
      setStatus("Sending location...");
      // First position failed ho tab bhi next cycle mein retry hoga.
      timer.current = setInterval(updatePosition, 10000);
      sending.current = true;
      try {
        await uploadPosition(position);
      } finally {
        sending.current = false;
      }
    } catch (err) {
      if (mounted.current && currentOperation === operation.current) {
        setError(locationMessage(err));
        setStatus("Location not confirmed");
        if ([401, 403, 404, 409, 410].includes(err.status)) stopLocalUpdates();
      }
    } finally {
      if (mounted.current && currentOperation === operation.current) setBusy(false);
    }
  }

  async function endSharing() {
    operation.current += 1;
    stopLocalUpdates();
    setBusy(true);
    setError("");
    try {
      await stopTracking(sessionId, token);
      if (mounted.current) setStatus("Stopped");
    } catch (err) {
      if (mounted.current) {
        setStatus("Local sharing stopped");
        setError(`${err.message}. Server stop confirm nahi hua; Stop dobara try karo.`);
      }
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  const button = "flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#090b12] p-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-widest text-violet-300">FLEETROVA</p>
        <h1 className="mt-2 text-xl font-semibold">Vehicle location sharing</h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">Upon starting, this device's location will be shared for the vehicle. Keep the page open and the screen active.</p>
        <div role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 p-3 text-sm"><MapPin size={17} />{status}</div>
        {!validLink && <p role="alert" className="mt-3 text-sm text-red-300">The tracking link is invalid. Open the full link, including the token.</p>}
        {error && <p role="alert" className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm leading-6 text-red-300">{error}</p>}
        {latest && <div className="mt-4 space-y-1 text-xs text-slate-400"><p>Last saved: {new Date(latest.receivedAt).toLocaleTimeString()}</p><p>Estimated accuracy: {Math.round(latest.accuracy)} metres</p></div>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" disabled={!validLink || busy || sharing.current || status === "Stopped"} onClick={() => beginSharing()} className={`${button} bg-violet-600 hover:bg-violet-500`}><Navigation size={16} />Start Tracking</button>
          <button type="button" disabled={!validLink || busy || status === "Stopped"} onClick={endSharing} className={`${button} border border-white/15 hover:bg-white/5`}><Square size={15} />Stop Tracking</button>
        </div>
        <button type="button" disabled={!validLink || busy || sharing.current || status === "Stopped"} onClick={() => beginSharing(true)} className="mt-4 text-xs text-violet-300 underline disabled:opacity-40">Has the session started already? Resume sharing</button>
        <p className="mt-4 text-xs leading-5 text-slate-500">The system will attempt to capture the location approximately every 10 seconds. Updates may pause when the app is running in the background or the screen is locked. Share the link only with the device being tracked.</p>
      </section>
    </main>
  );
}
