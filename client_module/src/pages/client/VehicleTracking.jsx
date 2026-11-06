import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Copy, ExternalLink, Link2, LocateFixed, MapPin, ChevronDown, Search, X, History } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getClientTracking, getVehicleHistory } from "../../services/trackingMapService";
import { createTrackingLink } from "../../services/vehicleService";

const labels = { online: "Live", offline: "Offline / last known", no_location: "No location yet" };
const formatTime = (date) => date ? new Date(date).toLocaleString() : "Not received yet";

export default function VehicleTracking() {
  const [params, setParams] = useSearchParams();
  // Repeated query params: ?vehicle=1&vehicle=2. Empty selection means all.
  const selectedIds = useMemo(() => [...new Set(params.getAll("vehicle")
    .filter((id) => /^[1-9][0-9]*$/.test(id)))], [params]);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const filterDropdown = useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [clockOffset, setClockOffset] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [fitRequest, setFitRequest] = useState(0);
  const [creating, setCreating] = useState(false);
  const [share, setShare] = useState(null);
  const [linkMessage, setLinkMessage] = useState("");
  const alive = useRef(false);
  const [historyVehicle, setHistoryVehicle] = useState(null);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyTruncated, setHistoryTruncated] = useState(false);
  const [historyReload, setHistoryReload] = useState(0);

  useEffect(() => {
    setHistoryPoints([]);
    setHistoryError("");
    setHistoryTruncated(false);
    if (!historyVehicle) { setHistoryLoading(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    setHistoryLoading(true);
    async function loadHistory() {
      try {
        const result = await getVehicleHistory(historyVehicle.vehicle_id, controller.signal);
        if (cancelled) return;
        setHistoryPoints(result.data);
        setHistoryTruncated(result.truncated);
      } catch (error) {
        if (!cancelled) setHistoryError(error.message);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    loadHistory();
    return () => { cancelled = true; controller.abort(); };
  }, [historyVehicle, historyReload]);

  useEffect(() => {
    alive.current = true;
    let cancelled = false;
    let timer;
    const controller = new AbortController();
    async function refresh() {
      try {
        const result = await getClientTracking(controller.signal);
        if (cancelled) return;
        setVehicles(result.data);
        setNow(Date.now());
        setClockOffset(Date.now() - new Date(result.serverTime).getTime());
        setLastRefresh(new Date());
        setError("");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(refresh, 5000);
        }
      }
    }
    refresh();
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      cancelled = true;
      alive.current = false;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, []);

  // Failed polling must not leave old markers falsely green.
  const rows = useMemo(() => vehicles.map((vehicle) => {
    const age = now - clockOffset - new Date(vehicle.lastLocation?.receivedAt).getTime();
    const stale = vehicle.trackingStatus === "online" && !(age >= 0 && age <= 45000);
    return { ...vehicle, trackingStatus: stale ? "offline" : vehicle.trackingStatus };
  }), [vehicles, now, clockOffset]);
  const visible = useMemo(() => selectedIds.length === 0 ? rows : rows.filter((vehicle) => selectedIds.includes(String(vehicle.vehicle_id))), [rows, selectedIds]);
  const selected = selectedIds.length === 1 ? rows.find((vehicle) => String(vehicle.vehicle_id) === selectedIds[0]) : null;
  const filterRows = rows.filter((vehicle) => vehicle.vehicle_number.toLowerCase().includes(vehicleSearch.trim().toLowerCase()));
  const onlineCount = rows.filter((vehicle) => vehicle.trackingStatus === "online").length;
  const offlineCount = rows.filter((vehicle) => vehicle.trackingStatus === "offline").length;
  const noLocationCount = rows.filter((vehicle) => vehicle.trackingStatus === "no_location").length;

  useEffect(() => {
    function closeDropdown(event) {
      if (filterDropdown.current && !filterDropdown.current.contains(event.target)) {
        filterDropdown.current.open = false;
      }
    }
    function closeOnEscape(event) {
      if (event.key === "Escape" && filterDropdown.current?.open) {
        filterDropdown.current.open = false;
        filterDropdown.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeDropdown);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeDropdown);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function updateSelection(ids) {
    setHistoryVehicle(null);
    const next = new URLSearchParams(params);
    next.delete("vehicle");
    ids.forEach((id) => next.append("vehicle", String(id)));
    setParams(next, { replace: true });
    setShare(null);
    setLinkMessage("");
  }

  function toggleVehicle(id) {
    const value = String(id);
    updateSelection(selectedIds.includes(value)
      ? selectedIds.filter((selectedId) => selectedId !== value)
      : [...selectedIds, value]);
  }

  function selectVehicle(id) {
    updateSelection([String(id)]);
  }

  function showHistory(vehicle) {
    updateSelection([String(vehicle.vehicle_id)]);
    setHistoryVehicle(vehicle);
  }

  async function makeLink(vehicle = selected) {
    if (!vehicle || vehicle.status !== "active") return;
    setCreating(true);
    setLinkMessage("");
    setShare(null);
    try {
      const result = await createTrackingLink(vehicle.vehicle_id);
      if (!alive.current) return;
      const url = new URL(result.data.trackingUrl);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("Invalid tracking URL");
      setShare({ ...result.data, vehicleNumber: vehicle.vehicle_number });
    } catch (err) {
      if (alive.current) setLinkMessage(err.message);
    } finally {
      if (alive.current) setCreating(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(share.trackingUrl);
      if (alive.current) setLinkMessage("Link copied. Send it to the mobile inside the vehicle.");
    } catch {
      if (alive.current) setLinkMessage("Copy nahi hua. Neeche link select karke manually copy karo.");
    }
  }

  const selectClass = "rounded-lg border border-slate-600 bg-[#111827] px-3 py-2 text-sm text-white outline-none";
  return (
    <div className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold text-white">Vehicle Tracking</h1><p className="mt-1 text-xs text-slate-400">All your vehicles, live updates and last-known positions.</p></div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Stat label="Vehicles" value={rows.length} color="text-white" />
          <Stat label="Live" value={onlineCount} color="text-emerald-300" />
          <Stat label="Offline" value={offlineCount} color="text-red-300" />
          <Stat label="No location" value={noLocationCount} color="text-slate-400" />
        </div>
      </header>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#111827] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Vehicles</span>
          <details ref={filterDropdown} className="relative z-[700]">
            <summary onClick={(event) => { if (creating) event.preventDefault(); }} aria-label="Choose vehicles to display on map" className={`${selectClass} flex cursor-pointer list-none items-center gap-3 [&::-webkit-details-marker]:hidden ${creating ? "opacity-50" : ""}`}>
              <span>{selectedIds.length ? `${selectedIds.length} vehicles selected` : `All vehicles (${rows.length})`}</span><ChevronDown size={15} />
            </summary>
            <div className="absolute left-0 top-full mt-2 w-[min(320px,calc(100vw-4rem))] overflow-hidden rounded-xl border border-slate-600 bg-[#111827] shadow-2xl">
              <div className="border-b border-white/10 p-3">
                <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0d1320] px-2.5 py-2"><Search size={14} className="text-slate-400" /><input aria-label="Search vehicle numbers" value={vehicleSearch} onChange={(event) => setVehicleSearch(event.target.value)} placeholder="Search vehicle number" className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none" /></label>
                <div className="mt-2 flex items-center justify-between gap-2"><span className="text-[11px] text-slate-400">{selectedIds.length ? `${selectedIds.length} checked` : "None checked: all visible"}</span><button type="button" disabled={creating || !selectedIds.length} onClick={() => updateSelection([])} className="inline-flex items-center gap-1 text-xs text-violet-300 disabled:opacity-40"><X size={12} />Show all</button></div>
              </div>
              <div className="max-h-64 overflow-y-auto overscroll-contain p-1.5">
                {filterRows.map((vehicle) => <label key={vehicle.vehicle_id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 hover:bg-white/5"><input type="checkbox" checked={selectedIds.includes(String(vehicle.vehicle_id))} disabled={creating} onChange={() => toggleVehicle(vehicle.vehicle_id)} className="h-4 w-4 shrink-0 accent-violet-500" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-white">{vehicle.vehicle_number}</span><span className="mt-0.5 block text-[10px] text-slate-400">{labels[vehicle.trackingStatus]}</span></span><span className={`h-2 w-2 rounded-full ${vehicle.trackingStatus === "online" ? "bg-emerald-400" : vehicle.trackingStatus === "offline" ? "bg-red-400" : "bg-slate-500"}`} /></label>)}
                {!filterRows.length && <p className="px-3 py-5 text-center text-xs text-slate-400">No matching vehicles</p>}
              </div>
              <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-4 text-slate-400">Check any vehicles to compare them. Uncheck all to see every vehicle.</p>
            </div>
          </details>
          <button type="button" onClick={() => setFitRequest((value) => value + 1)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"><LocateFixed size={15} />Fit map</button>
        </div>
        <button type="button" onClick={() => makeLink()} title={selected ? "Create a link for this vehicle" : "Select one vehicle or use its link button in the table"} disabled={!selected || selected.status !== "active" || creating} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Link2 size={15} />{creating ? "Creating..." : "Create Sharing Link"}</button>
      </div>
      {error && <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}. Last-known data is shown; retrying automatically.</p>}
      {linkMessage && <p role="status" className="rounded-lg bg-violet-500/10 px-3 py-2 text-xs text-violet-200">{linkMessage}</p>}
      {share && <section className="rounded-xl border border-violet-400/25 bg-violet-500/10 p-4">
        <p className="text-sm font-semibold text-white">Sharing link · {share.vehicleNumber}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Send this private link to another mobile. No client login is needed there. Start Sharing on that mobile; keep this map open on your laptop.</p>
        <div className="mt-3 flex flex-wrap gap-2"><input aria-label="Private tracking link" readOnly value={share.trackingUrl} onFocus={(event) => event.target.select()} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0d1320] px-3 py-2 text-xs text-slate-300" /><button type="button" onClick={copyLink} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs text-white"><Copy size={14} />Copy Link</button><a href={share.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300"><ExternalLink size={14} />Open separately</a></div>
        <p className="mt-2 text-xs text-slate-500">Expires: {formatTime(share.expiresAt)}. Creating a link does not start location sharing.</p>
      </section>}
      {historyVehicle && <section className="rounded-xl border border-violet-400/25 bg-[#111827] p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-sm font-semibold text-white">History · {historyVehicle.vehicle_number}</h2><p className="mt-1 text-xs text-slate-400">Past 24 hours · {historyPoints.length} saved points · Separate sessions have separate route lines.</p></div>
          <div className="flex gap-3"><button type="button" disabled={historyLoading} onClick={() => setHistoryReload(historyReload + 1)} className="text-xs text-violet-300 disabled:opacity-40">Refresh history</button><button type="button" onClick={() => setHistoryVehicle(null)} className="text-xs text-slate-300">Close history</button></div>
        </div>
        {historyLoading && <p role="status" className="mt-2 text-xs text-slate-400">Loading history...</p>}
        {historyError && <p role="alert" className="mt-2 text-xs text-red-300">{historyError}</p>}
        {!historyLoading && !historyError && historyPoints.length === 0 && <p className="mt-2 text-xs text-slate-400">No history saved in the past 24 hours. Start sharing and then refresh history.</p>}
        {historyTruncated && <p className="mt-2 text-xs text-amber-300">Showing only the latest 1,000 points.</p>}
        {historyPoints.length > 0 && <p className="mt-2 text-xs text-slate-400">From {formatTime(historyPoints[0].receivedAt)} to {formatTime(historyPoints[historyPoints.length - 1].receivedAt)}. Purple lines connect received coordinates; they are not road-matched routes.</p>}
      </section>}
      <div className="relative isolate overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
        <TrackingMap vehicles={visible} fitRequest={fitRequest} historyPoints={historyPoints} historyOpen={!!historyVehicle} />
        {(loading || (!historyVehicle && visible.every((vehicle) => !vehicle.lastLocation))) && <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] mx-auto max-w-sm rounded-xl bg-[#111827]/95 px-4 py-3 text-center text-xs leading-5 text-white shadow-xl">{loading ? "Loading vehicle locations..." : "No saved location for this selection. Create a sharing link and start sharing from another mobile."}</div>}
      </div>
      <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-400"><p><span className="text-emerald-300">●</span> Fresh location &nbsp; <span className="text-red-400">●</span> Stopped / expired / no update for 45s</p><p>Map refresh: {lastRefresh ? lastRefresh.toLocaleTimeString() : "Waiting..."}</p></div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111827]">
        <table className="w-full text-left text-xs"><thead className="border-b border-white/10 text-slate-400"><tr><th className="px-4 py-3">Vehicle</th><th className="px-4 py-3">Tracking</th><th className="px-4 py-3">Last received / last seen</th><th className="px-4 py-3">Last coordinates</th><th className="px-4 py-3 text-center">Actions</th></tr></thead><tbody className="divide-y divide-white/5">
          {visible.map((vehicle) => <tr key={vehicle.vehicle_id}><td className="whitespace-nowrap px-4 py-3 font-medium text-white">{vehicle.vehicle_number}</td><td className={`px-4 py-3 ${vehicle.trackingStatus === "online" ? "text-emerald-300" : vehicle.trackingStatus === "offline" ? "text-red-300" : "text-slate-400"}`}>{labels[vehicle.trackingStatus]}</td><td className="whitespace-nowrap px-4 py-3 text-slate-300">{formatTime(vehicle.lastLocation?.receivedAt)}</td><td className="px-4 py-3 text-slate-400">{vehicle.lastLocation ? `${vehicle.lastLocation.latitude.toFixed(5)}, ${vehicle.lastLocation.longitude.toFixed(5)}` : "Not available"}</td><td className="px-4 py-3 text-center"><button type="button" disabled={creating || !vehicle.lastLocation} onClick={() => selectVehicle(vehicle.vehicle_id)} className="rounded-lg border border-white/10 p-2 text-violet-300 disabled:opacity-30" aria-label={`Focus ${vehicle.vehicle_number}`}><MapPin size={15} /></button><button type="button" disabled={creating || vehicle.status !== "active"} onClick={() => makeLink(vehicle)} className="ml-2 rounded-lg border border-white/10 p-2 text-violet-300 disabled:opacity-30" aria-label={`Create sharing link for ${vehicle.vehicle_number}`} title="Create sharing link"><Link2 size={15} /></button><button type="button" onClick={() => showHistory(vehicle)} className="ml-2 rounded-lg border border-white/10 p-2 text-violet-300" aria-label={`View history for ${vehicle.vehicle_number}`} title="View past 24 hours"><History size={15} /></button></td></tr>)}
          {!loading && !visible.length && <tr><td colSpan={5} className="p-6 text-center text-slate-400">No vehicles found. Add one from My Vehicles.</td></tr>}
        </tbody></table>
      </div>
      <p className="text-xs leading-5 text-slate-500">Live means fresh location updates, not proof that the vehicle is moving. Red markers show the last received position. Location may be approximate; click a marker for accuracy.</p>
    </div>
  );
}

function Stat({ label, value, color }) {
  return <div className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2"><span className="text-slate-400">{label}</span><strong className={`ml-2 ${color}`}>{value}</strong></div>;
}

function TrackingMap({ vehicles, fitRequest, historyPoints, historyOpen }) {
  const container = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map());
  const fitted = useRef("");
  const historyLayer = useRef(null);
  useEffect(() => {
    const instance = L.map(container.current).setView([22.5, 79], 5);
    map.current = instance;
    historyLayer.current = L.layerGroup().addTo(instance);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; markers.current.clear(); fitted.current = ""; };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const located = vehicles.filter((vehicle) => Number.isFinite(vehicle.lastLocation?.latitude) && Number.isFinite(vehicle.lastLocation?.longitude));
    const ids = new Set(located.map((vehicle) => vehicle.vehicle_id));
    for (const [id, marker] of markers.current) {
      if (!ids.has(id)) { marker.remove(); markers.current.delete(id); }
    }
    for (const vehicle of located) {
      const location = vehicle.lastLocation;
      const point = [location.latitude, location.longitude];
      const color = vehicle.trackingStatus === "online" ? "#10b981" : "#ef4444";
      const icon = createVehicleIcon(vehicle, color);
      const popup = document.createElement("div");
      popup.style.color = "#172033";
      for (const text of [vehicle.vehicle_number, labels[vehicle.trackingStatus], `Last seen: ${formatTime(location.receivedAt)}`, `Accuracy: ${Math.round(location.accuracy || 0)} metres`, `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`]) {
        const line = document.createElement("div"); line.textContent = text; popup.appendChild(line);
      }
      let marker = markers.current.get(vehicle.vehicle_id);
      if (!marker) { marker = L.marker(point, { icon }).addTo(instance).bindPopup(popup); markers.current.set(vehicle.vehicle_id, marker); }
      else { marker.setLatLng(point).setIcon(icon).setPopupContent(popup); }
    }
    // Fit when selection changes, or Fit map is clicked. Don't interrupt panning on every poll.
    const key = located.map((vehicle) => vehicle.vehicle_id).sort().join(",") + ":" + fitRequest;
    if (!historyOpen && located.length && fitted.current !== key) {
      instance.fitBounds(located.map((vehicle) => [vehicle.lastLocation.latitude, vehicle.lastLocation.longitude]), { padding: [85, 85], maxZoom: located.length === 1 ? 16 : 14 });
      fitted.current = key;
    }
  }, [vehicles, fitRequest, historyOpen]);

  useEffect(() => {
    historyLayer.current.clearLayers();
    if (!historyOpen) { fitted.current = ""; return; }
    const sessions = new Map();
    const allPoints = [];
    for (const point of historyPoints) {
      if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)) continue;
      const key = String(point.sessionId);
      if (!sessions.has(key)) sessions.set(key, []);
      const coordinates = [point.latitude, point.longitude];
      sessions.get(key).push(coordinates);
      allPoints.push(coordinates);
    }
    for (const points of sessions.values()) {
      if (points.length > 1) L.polyline(points, { color: "#8b5cf6", weight: 4, opacity: 0.85 }).addTo(historyLayer.current);
      L.circleMarker(points[0], { radius: 6, color: "#059669", fillOpacity: 1 }).bindTooltip("Session start").addTo(historyLayer.current);
      if (points.length > 1) L.circleMarker(points[points.length - 1], { radius: 6, color: "#dc2626", fillOpacity: 1 }).bindTooltip("Last saved point").addTo(historyLayer.current);
    }
    if (allPoints.length) map.current.fitBounds(allPoints, { padding: [60, 60], maxZoom: 16 });
  }, [historyPoints, historyOpen, fitRequest]);
  return <div ref={container} className="h-[420px] w-full bg-slate-200 sm:h-[520px]" aria-label="Vehicle location map" />;
}

// DOM textContent keeps vehicle numbers safe; only fixed SVG shapes use innerHTML.
function createVehicleIcon(vehicle, color) {
  const root = document.createElement("div");
  root.style.cssText = "display:flex;flex-direction:column;align-items:center;width:132px;gap:4px;";
  const badge = document.createElement("div");
  badge.style.cssText = `display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:12px;background:${color};border:2px solid white;box-shadow:0 3px 10px #0005;color:white;`;
  const shapes = {
    car: '<path d="m5 10 2-5h10l2 5M3 10h18v8H3z"/><path d="M6 18v2m12-2v2M6 13h2m8 0h2"/>',
    bus: '<rect x="5" y="3" width="14" height="17" rx="3"/><path d="M5 10h14M12 3v7M7 20v1m10-1v1M8 15h1m6 0h1"/>',
    van: '<path d="M3 6h12l6 5v7H3zM15 6v6h6M3 12h12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    truck: '<path d="M2 5h12v12H2zM14 9h4l4 4v4h-8M14 13h8"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  };
  const shape = shapes[String(vehicle.vehicle_type || "").toLowerCase()] || shapes.truck;
  badge.innerHTML = `<svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
  const number = document.createElement("div");
  number.textContent = vehicle.vehicle_number;
  number.style.cssText = `max-width:132px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:3px 7px;background:white;color:#172033;border:1px solid ${color};border-radius:6px;font:600 11px/16px Arial,sans-serif;box-shadow:0 2px 6px #0003;`;
  root.append(badge, number);
  return L.divIcon({ className: "", html: root, iconSize: [132, 64], iconAnchor: [66, 18], popupAnchor: [0, -22] });
}
