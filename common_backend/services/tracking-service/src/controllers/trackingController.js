const crypto = require("crypto");
const TrackingSession = require("../models/TrackingSession");
const LocationPoint = require("../models/LocationPoint");

const createTrackingLink = async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);
  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle ID"
    });
  }
  if (!process.env.INTERNAL_SERVICE_KEY) {
    return res.status(503).json({
      success: false,
      message: "Internal service authentication is not configured"
    });
  }
  try {
    const clientServiceUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

    // Vehicle ki ownership Client Service se lo.
    const response = await fetch(`${clientServiceUrl}/internal/vehicles/${vehicleId}/tracking`, {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY
      },
      signal: AbortSignal.timeout(5000)
    });
    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }
    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message: "Vehicle verification is unavailable"
      });
    }
    const result = await response.json();
    const vehicle = result.data;
    if (result.success !== true || vehicle?.vehicle_id !== vehicleId || !Number.isSafeInteger(vehicle?.client_id)) {
      return res.status(503).json({
        success: false,
        message: "Invalid vehicle verification response"
      });
    }

    // Login ki client ID aur vehicle owner same hone chahiye.
    if (vehicle.client_id !== req.clientId) {
      return res.status(403).json({
        success: false,
        message: "You cannot track this vehicle"
      });
    }
    if (vehicle.approval_status !== "verified" || vehicle.status !== "active" || vehicle.client_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Vehicle or client account is inactive"
      });
    }

    // Mobile tracking link ke liye random secret.
    const token = crypto.randomBytes(32).toString("hex");

    // Database mein actual secret ki jagah hash save hoga.
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await TrackingSession.create({
      vehicleId,
      clientId: req.clientId,
      tokenHash,
      expiresAt,
      status: "ready"
    });
    const frontendUrl = (process.env.CLIENT_FRONTEND_URL || "http://localhost:5175").replace(/\/$/, "");
    const trackingUrl = `${frontendUrl}/track/${session._id}#token=${token}`;
    res.setHeader("Cache-Control", "no-store");
    return res.status(201).json({
      success: true,
      message: "Tracking link created successfully",
      data: {
        sessionId: session._id,
        vehicleId,
        vehicleNumber: vehicle.vehicle_number,
        trackingUrl,
        expiresAt
      }
    });
  } catch (error) {
    console.error("Create tracking link:", error.message);
    return res.status(503).json({
      success: false,
      message: "Unable to create tracking link"
    });
  }
};
const startTracking = async (req, res) => {
  try {
    const session = await TrackingSession.findOneAndUpdate({
      _id: req.trackingSession._id,
      status: "ready",
      expiresAt: {
        $gt: new Date()
      }
    }, {
      $set: {
        status: "tracking",
        startedAt: new Date()
      }
    }, {
      new: true,
      runValidators: true
    });
    if (!session) {
      return res.status(409).json({
        success: false,
        message: "Session is already started, stopped or expired"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Tracking started successfully",
      data: {
        sessionId: session._id,
        vehicleId: session.vehicleId,
        status: session.status,
        startedAt: session.startedAt
      }
    });
  } catch (error) {
    console.error("Start tracking:", error.message);
    return res.status(503).json({
      success: false,
      message: "Unable to start tracking"
    });
  }
};
const updateLocation = async (req, res) => {
  const {
    latitude,
    longitude,
    accuracy
  } = req.body || {};

  // Numbers hi accept karo; strings ya missing values nahi.
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      message: "Latitude must be a number between -90 and 90"
    });
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      message: "Longitude must be a number between -180 and 180"
    });
  }
  if (!Number.isFinite(accuracy) || accuracy < 0) {
    return res.status(400).json({
      success: false,
      message: "Valid location accuracy is required"
    });
  }
  try {
    const currentSession = req.trackingSession;

    // Vehicle/client ko baad mein inactive kiya ho to tracking rok do.
    const clientServiceUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const response = await fetch(`${clientServiceUrl}/internal/vehicles/${currentSession.vehicleId}/tracking`, {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY
      },
      signal: AbortSignal.timeout(5000)
    });
    if (response.status === 404) {
      return res.status(403).json({
        success: false,
        message: "Vehicle is unavailable"
      });
    }
    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message: "Vehicle verification is unavailable"
      });
    }
    const result = await response.json();
    const vehicle = result.data;
    if (result.success !== true || vehicle?.vehicle_id !== currentSession.vehicleId || vehicle?.client_id !== currentSession.clientId || vehicle?.approval_status !== "verified" || vehicle?.status !== "active" || vehicle?.client_status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Vehicle or client account is unavailable"
      });
    }
    const session = await TrackingSession.findOneAndUpdate({
      _id: currentSession._id,
      status: "tracking",
      expiresAt: {
        $gt: new Date()
      }
    }, {
      $set: {
        "latestLocation.latitude": latitude,
        "latestLocation.longitude": longitude,
        "latestLocation.accuracy": accuracy
      },
      $currentDate: {
        "latestLocation.receivedAt": true
      }
    }, {
      new: true,
      runValidators: true
    });
    if (!session) {
      return res.status(409).json({
        success: false,
        message: "Tracking is not running or the link has expired"
      });
    }
    // Har accepted location history mein alag record banegi.
await LocationPoint.create({
  sessionId: session._id,
  latitude: session.latestLocation.latitude,
  longitude: session.latestLocation.longitude,
  accuracy: session.latestLocation.accuracy,
  receivedAt: session.latestLocation.receivedAt,
});
    return res.status(200).json({
      success: true,
      message: "Location updated successfully",
      data: {
        sessionId: session._id,
        vehicleId: session.vehicleId,
        latestLocation: session.latestLocation
      }
    });
  } catch (error) {
    console.error("Update tracking location:", error.message);
    return res.status(503).json({
      success: false,
      message: "Unable to update location"
    });
  }
};
const stopTracking = async (req, res) => {
  try {
    const session = await TrackingSession.findOneAndUpdate({
      _id: req.trackingSession._id,
      status: {
        $in: ["ready", "tracking"]
      },
      expiresAt: {
        $gt: new Date()
      }
    }, {
      $set: {
        status: "stopped",
        stoppedAt: new Date()
      }
    }, {
      new: true,
      runValidators: true
    });
    if (!session) {
      return res.status(409).json({
        success: false,
        message: "Tracking is already stopped or expired"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Tracking stopped successfully",
      data: {
        sessionId: session._id,
        vehicleId: session.vehicleId,
        status: session.status,
        stoppedAt: session.stoppedAt
      }
    });
  } catch (error) {
    console.error("Stop tracking:", error.message);
    return res.status(503).json({
      success: false,
      message: "Unable to stop tracking"
    });
  }
};
const getClientTracking = async (req, res) => {
  try {
    const clientUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    // Existing Client Service verifies the cookie and returns ONLY this client's vehicles.
    const response = await fetch(`${clientUrl}/api/client/vehicles`, {
      headers: {
        Cookie: `client_token=${encodeURIComponent(req.cookies.client_token)}`
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) {
      return res.status([401, 403].includes(response.status) ? response.status : 503).json({
        success: false,
        message: "Unable to load your vehicles"
      });
    }
    const result = await response.json();
    if (result.success !== true || !Array.isArray(result.data)) {
      return res.status(503).json({
        success: false,
        message: "Invalid vehicle service response"
      });
    }
    const vehicles = result.data.filter(vehicle => vehicle.approval_status === "verified");
    const ids = vehicles.map(vehicle => vehicle.vehicle_id);
    // Latest RECEIVED location across sessions. A new unused link won't hide the old position.
    // Explicit fields below prevent tokenHash from being returned by aggregation.
    const locations = ids.length ? await TrackingSession.aggregate([{
      $match: {
        clientId: req.clientId,
        vehicleId: {
          $in: ids
        },
        "latestLocation.receivedAt": {
          $type: "date"
        }
      }
    }, {
      $sort: {
        "latestLocation.receivedAt": -1,
        _id: -1
      }
    }, {
      $group: {
        _id: "$vehicleId",
        location: {
          $first: "$latestLocation"
        },
        sessionStatus: {
          $first: "$status"
        },
        expiresAt: {
          $first: "$expiresAt"
        }
      }
    }]) : [];
    const byVehicle = new Map(locations.map(row => [row._id, row]));
    const now = new Date();
    const data = vehicles.map(vehicle => {
      const saved = byVehicle.get(vehicle.vehicle_id);
      const location = saved?.location;
      const hasLocation = Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
      const age = hasLocation ? now.getTime() - new Date(location.receivedAt).getTime() : Infinity;
      const online = vehicle.status === "active" && vehicle.expiry_date >= new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10) && saved?.sessionStatus === "tracking" && new Date(saved.expiresAt).getTime() > now.getTime() && age >= 0 && age <= 45000;
      return {
        ...vehicle,
        trackingStatus: !hasLocation ? "no_location" : online ? "online" : "offline",
        lastLocation: hasLocation ? location : null,
        sessionStatus: saved?.sessionStatus || null
      };
    });
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      success: true,
      data,
      serverTime: now,
      freshnessSeconds: 45
    });
  } catch (error) {
    console.error("Client tracking map:", error.message);
    return res.status(503).json({
      success: false,
      message: "Tracking data is unavailable"
    });
  }
};

const getAdminTracking = async (req, res) => {
  try {
    const clientUrl =
      process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

    // Step 1: Sabhi clients ke verified vehicles lo.
    const response = await fetch(
      `${clientUrl}/internal/tracking/vehicles`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error("Unable to load vehicles");
    }

    const result = await response.json();

    if (result.success !== true || !Array.isArray(result.data)) {
      throw new Error("Invalid vehicle response");
    }

    const vehicles = result.data;
    const vehicleIds = vehicles.map(vehicle => vehicle.vehicle_id);

    // Step 2: Har vehicle ki latest received location lo.
    const locations = vehicleIds.length
      ? await TrackingSession.aggregate([
          {
            $match: {
              vehicleId: { $in: vehicleIds },
              "latestLocation.receivedAt": { $type: "date" },
            },
          },
          {
            $sort: {
              "latestLocation.receivedAt": -1,
              _id: -1,
            },
          },
          {
            $group: {
              _id: {
                vehicleId: "$vehicleId",
                clientId: "$clientId",
              },
              location: { $first: "$latestLocation" },
              sessionStatus: { $first: "$status" },
              expiresAt: { $first: "$expiresAt" },
            },
          },
        ])
      : [];

    // Vehicle aur uske owner ke hisab se location rakho.
    const locationMap = new Map();

    for (const row of locations) {
      const key = `${row._id.clientId}-${row._id.vehicleId}`;
      locationMap.set(key, row);
    }

    const now = new Date();

    // India ki current date: RC expiry check ke liye.
    const today = new Date(
      now.getTime() + 330 * 60 * 1000
    ).toISOString().slice(0, 10);

    // Step 3: Vehicle details ke saath location jodo.
    const data = vehicles.map(vehicle => {
      const key = `${vehicle.client_id}-${vehicle.vehicle_id}`;
      const saved = locationMap.get(key);
      const location = saved?.location;

      const hasLocation =
        Number.isFinite(location?.latitude) &&
        Number.isFinite(location?.longitude);

      const age = hasLocation
        ? now.getTime() - new Date(location.receivedAt).getTime()
        : Infinity;

      const online =
        vehicle.status === "active" &&
        vehicle.expiry_date >= today &&
        saved?.sessionStatus === "tracking" &&
        new Date(saved.expiresAt).getTime() > now.getTime() &&
        age >= 0 &&
        age <= 45000;

      let trackingStatus = "no_location";

      if (hasLocation) {
        trackingStatus = online ? "online" : "offline";
      }

      return {
        ...vehicle,
        trackingStatus,
        lastLocation: hasLocation ? location : null,
      };
    });

    res.setHeader("Cache-Control", "no-store");

    return res.json({
      success: true,
      data,
      serverTime: now,
      freshnessSeconds: 45,
    });
  } catch (error) {
    console.error("Admin tracking:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load vehicle tracking",
    });
  }
};

const getClientVehicleHistory = async (req, res) => {
  const vehicleId = Number(req.params.vehicleId);

  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle ID",
    });
  }

  try {
    // Pehle check karo vehicle abhi isi client ka hai.
    const clientUrl =
      process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

    const response = await fetch(
      `${clientUrl}/internal/vehicles/${vehicleId}/tracking`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (!response.ok) {
      throw new Error("Unable to verify vehicle");
    }

    const result = await response.json();
    const vehicle = result.data;

    if (
      result.success !== true ||
      vehicle?.client_id !== req.clientId
    ) {
      return res.status(403).json({
        success: false,
        message: "You cannot view this vehicle history",
      });
    }

    // Is client aur vehicle ke tracking sessions lo.
    const sessions = await TrackingSession.find({
      vehicleId,
      clientId: req.clientId,
    }).select("_id");

    const sessionIds = sessions.map(session => session._id);

    const fromDate = new Date(
      Date.now() - 24 * 60 * 60 * 1000
    );

    // Latest 1001 points lo; extra point se limit ka pata chalega.
    const points = await LocationPoint.find({
      sessionId: { $in: sessionIds },
      receivedAt: { $gte: fromDate },
    })
      .select("sessionId latitude longitude accuracy receivedAt -_id")
      .sort({ receivedAt: -1, _id: -1 })
      .limit(1001)
      .lean();

    const truncated = points.length > 1000;

    // Frontend ko purani se nayi location ke order mein do.
    const history = points.slice(0, 1000).reverse();

    return res.json({
      success: true,
      data: history,
      truncated,
    });
  } catch (error) {
    console.error("Vehicle history:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load vehicle history",
    });
  }
};

module.exports = {
  createTrackingLink,
  startTracking,
  updateLocation,
  stopTracking,
  getClientTracking,getAdminTracking,getClientVehicleHistory,
};
