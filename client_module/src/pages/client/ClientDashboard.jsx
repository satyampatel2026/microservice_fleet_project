import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Truck, ShieldCheck, Clock3, Radio, RefreshCw, ArrowUpRight, UsersRound, CalendarDays, Activity, CheckCircle2 } from "lucide-react";
import { getVehicles } from "../../services/vehicleService";
import { getClientTracking } from "../../services/trackingMapService";

import { getDrivers } from "../../services/driverService";
import { getTrips } from "../../services/tripService";

export default function ClientDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [updatedAt, setUpdatedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let timer;
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        // Existing APIs se vehicles, tracking, drivers aur trips lo.
        const [vehicleResult, trackingResult, driverResult, tripResult] = await Promise.all([
          getVehicles(),
          getClientTracking(controller.signal),
          getDrivers(),
          getTrips(),
        ]);

        if (cancelled) return;
        setVehicles(vehicleResult.data);
        setTracking(trackingResult.data);
        setDrivers(driverResult.data);
        setTrips(tripResult.data);
        setUpdatedAt(new Date());
        setError("");
      } catch (error) {
        if (!cancelled) setError(error.message);
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Current request complete hone ke baad agla refresh.
          timer = setTimeout(loadDashboard, 15000);
        }
      }
    }

    loadDashboard();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [reload]);

  // Ye numbers API se aaye records ko count karke milte hain.
  const verified = vehicles.filter(vehicle => vehicle.approval_status === "verified").length;
  const pending = vehicles.filter(vehicle => vehicle.approval_status === "pending").length;
  const rejected = vehicles.filter(vehicle => vehicle.approval_status === "rejected").length;
  const active = vehicles.filter(vehicle => vehicle.status === "active").length;
  const live = tracking.filter(vehicle => vehicle.trackingStatus === "online").length;
  const offline = tracking.filter(vehicle => vehicle.trackingStatus === "offline").length;
  const noLocation = tracking.filter(vehicle => vehicle.trackingStatus === "no_location").length;

  const scheduled = trips.filter(trip => trip.status === "scheduled").length;
  const ongoing = trips.filter(trip => trip.status === "ongoing").length;
  const completed = trips.filter(trip => trip.status === "completed").length;

  const cards = [
    { title: "Total Vehicles", value: vehicles.length, icon: Truck },
    { title: "Verified", value: verified, icon: ShieldCheck },
    { title: "Pending Review", value: pending, icon: Clock3 },
    { title: "Live Tracking", value: live, icon: Radio },
    { title: "Total Drivers", value: drivers.length, icon: UsersRound },
    { title: "Scheduled Trips", value: scheduled, icon: CalendarDays },
    { title: "Ongoing Trips", value: ongoing, icon: Activity },
    { title: "Completed Trips", value: completed, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-xs text-slate-400">Your vehicles, drivers, trips and tracking updates.</p>
        </div>
        <button type="button" disabled={loading} onClick={() => {
          setLoading(true);
          setReload(reload + 1);
        }} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 hover:bg-white/5 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {loading ? (
        <p role="status" className="py-10 text-center text-sm text-slate-400">Loading dashboard...</p>
      ) : error ? (
        <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error}. Please refresh to try again. Dashboard also retries automatically.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(({ title, value, icon: Icon }) => (
              <div key={title} className="rounded-xl border border-white/10 bg-[#111521] p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-400">{title}</p>
                  <Icon size={17} className="text-violet-300" />
                </div>
                <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 px-1 text-xs text-slate-400">
            <span>Active: <strong className="text-emerald-300">{active}</strong></span>
            <span>Inactive: <strong className="text-slate-200">{vehicles.length - active}</strong></span>
            <span>Rejected: <strong className="text-red-300">{rejected}</strong></span>
            <span>Tracking offline: <strong className="text-red-300">{offline}</strong></span>
            <span>No location yet: <strong className="text-slate-200">{noLocation}</strong></span>
          </div>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#111521]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Latest Vehicles</h2>
              <Link to="/client/vehicles" className="inline-flex items-center gap-1 text-xs text-violet-300">View all <ArrowUpRight size={14} /></Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="bg-white/[0.02] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Vehicle</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Verification</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {vehicles.slice(0, 5).map(vehicle => (
                    <tr key={vehicle.vehicle_id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">{vehicle.vehicle_number}</td>
                      <td className="px-4 py-3 text-slate-300">{vehicle.vehicle_type}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-md px-2 py-1 capitalize ${vehicle.approval_status === "verified" ? "bg-emerald-400/10 text-emerald-300" : vehicle.approval_status === "rejected" ? "bg-red-400/10 text-red-300" : "bg-amber-400/10 text-amber-300"}`}>{vehicle.approval_status}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-300">{vehicle.status}</td>
                    </tr>
                  ))}
                  {vehicles.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-slate-400">No vehicles added yet. Add your first vehicle to get started.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/client/vehicles" className="rounded-lg bg-violet-500 px-4 py-2 text-xs font-medium text-white hover:bg-violet-400">Manage Vehicles</Link>
            <Link to="/client/tracking" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-200 hover:bg-white/5">Open Tracking Map</Link>
            <Link to="/client/drivers" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-200 hover:bg-white/5">My Drivers</Link>
            <Link to="/client/trips" className="rounded-lg border border-white/10 px-4 py-2 text-xs text-slate-200 hover:bg-white/5">My Trips</Link>
            <p className="text-[11px] text-slate-500">Updated {updatedAt?.toLocaleTimeString()} · Auto refresh: 15 seconds</p>
          </div>
          <p className="text-[11px] text-slate-500">Tracking counts cover verified vehicles. Live means a recent location update, and does not indicate whether the vehicle is moving.</p>
        </>
      )}
    </div>
  );
}
