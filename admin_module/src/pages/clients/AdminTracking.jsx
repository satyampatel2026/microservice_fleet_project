import { useEffect, useRef, useState } from "react";
import { ChevronDown, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getAdminTracking } from "../../services/trackingService";

const labels = { online: "Live", offline: "Offline / last known", no_location: "No location yet" };
const panel = "rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)]";

export default function AdminTracking() {
  const [vehicles, setVehicles] = useState([]);
  const [clientId, setClientId] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [serverOffset, setServerOffset] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer;
    const controller = new AbortController();

    async function loadTracking() {
      try {
        const result = await getAdminTracking(controller.signal);
        if (cancelled) return;
        setVehicles(result.data);
        setServerOffset(Date.now() - new Date(result.serverTime).getTime());
        setNow(Date.now());
        setUpdatedAt(new Date());
        setError("");
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          timer = setTimeout(loadTracking, 5000);
        }
      }
    }

    loadTracking();
    // Request fail ho tab bhi purani Live location red ho sake.
    const clock = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
      clearInterval(clock);
    };
  }, [reload]);

  const clients = [];
  for (const vehicle of vehicles) {
    if (!clients.some(client => client.id === vehicle.client_id)) {
      clients.push({ id: vehicle.client_id, name: vehicle.client_name });
    }
  }

  const clientVehicles = vehicles.filter(vehicle =>
    !clientId || String(vehicle.client_id) === clientId
  );
  const choices = clientVehicles.filter(vehicle =>
    vehicle.vehicle_number.toLowerCase().includes(search.trim().toLowerCase())
  );

  // Empty selection ka matlab: selected client ke sabhi vehicles.
  const visible = clientVehicles.filter(vehicle =>
    selectedIds.length === 0 || selectedIds.includes(vehicle.vehicle_id)
  ).map(vehicle => {
    const age = now - serverOffset - new Date(vehicle.lastLocation?.receivedAt).getTime();
    const stale = vehicle.trackingStatus === "online" && !(age >= 0 && age <= 45000);
    return { ...vehicle, trackingStatus: stale ? "offline" : vehicle.trackingStatus };
  });

  function toggleVehicle(id) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(value => value !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const live = visible.filter(vehicle => vehicle.trackingStatus === "online").length;
  const offline = visible.filter(vehicle => vehicle.trackingStatus === "offline").length;
  const noLocation = visible.filter(vehicle => vehicle.trackingStatus === "no_location").length;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Vehicle Tracking</h1>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">Verified vehicles across active clients.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => setReload(reload + 1)} className={`${panel} inline-flex items-center gap-2 px-3 py-2 text-xs disabled:opacity-50`}>
          <RefreshCw size={14} /> Refresh
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filter by client" value={clientId} onChange={event => {
          setClientId(event.target.value);
          setSelectedIds([]);
          setSearch("");
        }} className={`${panel} max-w-full px-3 py-2 text-sm text-[var(--admin-text)]`}>
          <option value="">All Clients</option>
          {clients.map(client => <option key={client.id} value={client.id}>{client.name} (#{client.id})</option>)}
        </select>

        <details className="relative z-[1100]">
          <summary className={`${panel} flex cursor-pointer list-none items-center gap-3 px-3 py-2 text-sm`}>
            {selectedIds.length ? `${selectedIds.length} vehicles selected` : "All Vehicles"}<ChevronDown size={14} />
          </summary>
          <div className={`${panel} absolute left-0 top-full mt-2 w-64 p-3 shadow-xl`}>
            <input aria-label="Search vehicle" placeholder="Search vehicle number" value={search} onChange={event => setSearch(event.target.value)} className="mb-2 w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-soft)] px-3 py-2 text-xs" />
            <button type="button" onClick={() => setSelectedIds([])} className="mb-2 text-xs text-[var(--admin-primary)]">Clear selection / Show all</button>
            <div className="max-h-56 overflow-y-auto">
              {choices.map(vehicle => <label key={vehicle.vehicle_id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-xs hover:bg-[var(--admin-soft)]">
                <input type="checkbox" checked={selectedIds.includes(vehicle.vehicle_id)} onChange={() => toggleVehicle(vehicle.vehicle_id)} />
                <span>{vehicle.vehicle_number}<small className="block text-[var(--admin-muted)]">{vehicle.client_name}</small></span>
              </label>)}
              {choices.length === 0 && <p className="py-3 text-xs text-[var(--admin-muted)]">No vehicles found.</p>}
            </div>
          </div>
        </details>

        <div className="flex flex-wrap gap-3 text-xs">
          <span>Total: <strong>{visible.length}</strong></span>
          <span className="text-emerald-600 dark:text-emerald-400">Live: <strong>{live}</strong></span>
          <span className="text-red-600 dark:text-red-400">Offline: <strong>{offline}</strong></span>
          <span className="text-[var(--admin-muted)]">No location: <strong>{noLocation}</strong></span>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-[var(--admin-muted)]">Loading tracking...</p>}
      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-300">{error}. Retrying automatically; displayed locations may be old.</p>}

      <TrackingMap vehicles={visible} filterKey={`${clientId}:${selectedIds.join(",")}`} />

      {!loading && visible.length === 0 && !error && <p className="text-sm text-[var(--admin-muted)]">No verified vehicles available for this selection.</p>}
      {visible.length > 0 && noLocation === visible.length && <p className="text-xs text-[var(--admin-muted)]">These vehicles have not shared a location yet. Their markers will appear after the first update.</p>}

      <div className={`${panel} overflow-x-auto`}>
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="bg-[var(--admin-soft)] text-[var(--admin-muted)]"><tr>
            {['Vehicle', 'Client', 'Tracking', 'Last Received', 'Vehicle Status'].map(title => <th key={title} className="px-4 py-3 font-medium">{title}</th>)}
          </tr></thead>
          <tbody>
            {visible.map(vehicle => <tr key={vehicle.vehicle_id} className="border-t border-[var(--admin-border)]">
              <td className="px-4 py-3 font-semibold">{vehicle.vehicle_number}</td>
              <td className="px-4 py-3">{vehicle.client_name}</td>
              <td className={`px-4 py-3 ${vehicle.trackingStatus === "online" ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--admin-muted)]"}`}>{labels[vehicle.trackingStatus]}</td>
              <td className="px-4 py-3">{vehicle.lastLocation ? new Date(vehicle.lastLocation.receivedAt).toLocaleString() : "Not received"}</td>
              <td className="px-4 py-3 capitalize">{vehicle.status}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--admin-muted)]">Refresh: 5 seconds · Last updated: {updatedAt?.toLocaleTimeString() || "—"} · Live indicates a recent location, not vehicle movement.</p>
    </div>
  );
}

function TrackingMap({ vehicles, filterKey }) {
  const container = useRef(null);
  const map = useRef(null);
  const markers = useRef(null);
  const lastFit = useRef(null);

  useEffect(() => {
    map.current = L.map(container.current).setView([23.2599, 77.4126], 6);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map.current);
    markers.current = L.layerGroup().addTo(map.current);
    // Layout animation/resize ke baad map ka size sahi rakho.
    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.current.remove();
      map.current = null;
      lastFit.current = null;
    };
  }, []);

  useEffect(() => {
    markers.current.clearLayers();
    const points = [];
    for (const vehicle of vehicles) {
      const location = vehicle.lastLocation;
      if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude)) continue;
      const point = [location.latitude, location.longitude];
      points.push(point);
      const color = vehicle.trackingStatus === "online" ? "#059669" : "#dc2626";

      const badge = document.createElement("div");
      badge.style.cssText = `display:flex;align-items:center;gap:5px;width:max-content;background:${color};color:white;padding:6px 8px;border:2px solid white;border-radius:8px;box-shadow:0 2px 6px #0004;font:600 11px system-ui;white-space:nowrap`;
      // Fixed vehicle SVG. Database text is added safely with textContent.
      badge.innerHTML = '<svg width="20" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M3 7h11v10H3zM14 11h4l3 4v2h-7"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>';
      const number = document.createElement("span");
      number.textContent = vehicle.vehicle_number;
      badge.appendChild(number);
      const icon = L.divIcon({ html: badge, className: "", iconSize: [130, 34], iconAnchor: [65, 17] });

      const popup = document.createElement("div");
      for (const text of [vehicle.vehicle_number, vehicle.client_name, labels[vehicle.trackingStatus], `Last received: ${new Date(location.receivedAt).toLocaleString()}`]) {
        const line = document.createElement("div");
        line.textContent = text;
        popup.appendChild(line);
      }
      L.marker(point, { icon }).bindPopup(popup).addTo(markers.current);
    }
    // Poll par zoom reset nahi hoga; filter badalne par selected vehicles fit honge.
    if (points.length && lastFit.current !== filterKey) {
      map.current.fitBounds(points, { padding: [60, 60], maxZoom: 15 });
      lastFit.current = filterKey;
    }
  }, [vehicles, filterKey]);

  return <div ref={container} aria-label="Vehicle tracking map" className="relative z-0 h-[430px] w-full overflow-hidden rounded-xl border border-[var(--admin-border)] sm:h-[500px]" />;
}
