const db=require("../model/db");
const { getPaidQuotes } = require("../utils/paidQuoteStatus");

const getServiceRequestsForAdmin = async (req, res) => {
  const allowedStatuses = [
    "pending",
    "assigned",
    "in_progress",
    "completed",
    "cancelled",
  ];

  const status = req.query.status || "all";
  const search =
    typeof req.query.search === "string" ? req.query.search.trim() : "";
  let page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);

  if (
    !["all", ...allowedStatuses].includes(status) ||
    search.length > 100 ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid status, search, or pagination",
    });
  }

  let where = "WHERE 1 = 1";
  const values = [];

  if (status !== "all") {
    where += " AND r.status = ?";
    values.push(status);
  }

  if (search) {
    const text = `%${search.replace(/[!%_]/g, "!$&")}%`;

    where += ` AND (
      CAST(r.request_id AS CHAR) LIKE ? ESCAPE '!'
      OR c.company_name LIKE ? ESCAPE '!'
      OR c.name LIKE ? ESCAPE '!'
      OR v.vehicle_number LIKE ? ESCAPE '!'
      OR r.service_name LIKE ? ESCAPE '!'
      OR r.request_code LIKE ? ESCAPE '!'
    )`;

    values.push(text, text, text, text, text, text);
  }

  try {
    // Summary cards ke counts hamesha saari requests ke honge.
    const [summaryRows] = await db.query(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(status = 'pending'), 0) AS pending,
         COALESCE(SUM(status = 'assigned'), 0) AS assigned,
         COALESCE(SUM(status = 'in_progress'), 0) AS in_progress,
         COALESCE(SUM(status = 'completed'), 0) AS completed,
         COALESCE(SUM(status = 'cancelled'), 0) AS cancelled
       FROM vehicle_service_requests`
    );

    // Current filter ke mutabik matching rows ki count.
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM vehicle_service_requests r
       LEFT JOIN clients c ON c.client_id = r.client_id
       LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
       ${where}`,
      values
    );

    const filteredTotal = Number(countRows[0].total);
    const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));
    page = Math.min(page, totalPages);
    const offset = (page - 1) * limit;

    const [requests] = await db.query(
      `SELECT
         r.request_id,
         r.request_code,
         r.client_id,
        c.company_name AS client_name,
        c.name AS contact_name,
         r.vehicle_id,
         v.vehicle_number,
         r.service_id,
         r.service_name,
         r.problem_description,
         r.priority,
         DATE_FORMAT(r.preferred_date, '%Y-%m-%d') AS preferred_date,
         r.status,
         q.id AS accepted_quote_id,
         q.accepted_subtotal AS approved_amount,
         r.assigned_partner_id,
         r.assigned_by,
         r.assigned_at,
         r.cancellation_reason,
         r.created_at,
         r.updated_at
       FROM vehicle_service_requests r
       LEFT JOIN clients c ON c.client_id = r.client_id
       LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
       LEFT JOIN service_quotes q ON q.id = ( SELECT id FROM service_quotes WHERE request_id = r.request_id  AND partner_id = r.assigned_partner_id
        AND status = 'accepted' ORDER BY id DESC LIMIT 1 )
       ${where}
       ORDER BY r.created_at DESC, r.request_id DESC
       LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const summary = summaryRows[0];
    const quoteIds = requests.map((request) => request.accepted_quote_id);
const paidQuotes = await getPaidQuotes(quoteIds).catch((error) => {
  console.error("Load admin payment status:", error.message);
  return null;
});

  for (const request of requests) {
  request.paymentStatus = "awaiting_quote";
  request.paymentOrderId = null;

  if (request.accepted_quote_id == null) continue;

  if (paidQuotes == null) {
    request.paymentStatus = "unavailable";
    continue;
  }

  const orderId = paidQuotes.get(Number(request.accepted_quote_id));

  if (orderId) {
    request.paymentStatus = "paid";
    request.paymentOrderId = orderId;
  } else {
    request.paymentStatus = "pending";
  }
}

    return res.json({
      success: true,
      data: requests,
      summary: {
        total: Number(summary.total),
        pending: Number(summary.pending),
        assigned: Number(summary.assigned),
        in_progress: Number(summary.in_progress),
        completed: Number(summary.completed),
        cancelled: Number(summary.cancelled),
      },
      pagination: {
        page,
        limit,
        total: filteredTotal,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Get admin service requests:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load service requests",
    });
  }
};

const getServiceRequestForAdmin = async (req, res) => {
  const requestId = Number(req.params.requestId);

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid service request ID",
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT request_id, service_id, status
       FROM vehicle_service_requests
       WHERE request_id = ?
       LIMIT 1`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get service request:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load service request",
    });
  }
};

const assignServiceRequestToPartner = async (req, res) => {
  const requestId = Number(req.params.requestId);
  const partnerId = Number(req.body?.partner_id);

  if (
    !Number.isSafeInteger(requestId) || requestId <= 0 ||
    !Number.isSafeInteger(partnerId) || partnerId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid request and partner IDs are required",
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE vehicle_service_requests
       SET status = 'assigned',
           assigned_partner_id = ?,
           assigned_at = UTC_TIMESTAMP(),
           updated_at = UTC_TIMESTAMP()
       WHERE request_id = ? AND status IN ('pending', 'assigned', 'in_progress')`,
      [partnerId, requestId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `SELECT status
         FROM vehicle_service_requests
         WHERE request_id = ?
         LIMIT 1`,
        [requestId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Service request not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Only pending requests can be assigned",
      });
    }

    return res.json({
      success: true,
      message: "Service request assigned",
      data: {
        request_id: requestId,
        partner_id: partnerId,
        status: "assigned",
      },
    });
  } catch (error) {
    console.error("Assign service request:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to assign service request",
    });
  }
};

const cancelServiceRequestByAdmin = async (req, res) => {
  const requestId = Number(req.params.requestId);
  const reason = String(req.body?.cancellation_reason || "").trim();

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid service request ID",
    });
  }

  if (!reason || reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required and must be under 500 characters",
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE vehicle_service_requests
       SET status = 'cancelled',
           cancellation_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE request_id = ?
         AND status IN ('pending', 'assigned', 'in_progress')`,
      [reason, requestId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `SELECT status
         FROM vehicle_service_requests
         WHERE request_id = ?
         LIMIT 1`,
        [requestId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Service request not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "This request can no longer be cancelled",
      });
    }

    return res.json({
      success: true,
      message: "Service request cancelled",
      data: {
        request_id: requestId,
        status: "cancelled",
        cancellation_reason: reason,
      },
    });
  } catch (error) {
    console.error("Cancel service request by admin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to cancel service request",
    });
  }
};

module.exports = {getServiceRequestsForAdmin, getServiceRequestForAdmin,assignServiceRequestToPartner,cancelServiceRequestByAdmin,};