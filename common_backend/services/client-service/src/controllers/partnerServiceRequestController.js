const { getPaidQuotes } = require("../utils/paidQuoteStatus");
const db = require("../model/db");
const { createClientNotification } = require("../utils/notificationService");

const getAssignedServiceRequestsForPartner = async (req, res) => {
  const partnerId = Number(req.params.partnerId);

  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner ID",
    });
  }

  try {
    const [requests] = await db.query(
      `SELECT
         r.request_id,
         r.request_code,
         r.service_name,
         r.problem_description,
         r.priority,
         DATE_FORMAT(r.preferred_date, '%Y-%m-%d') AS preferred_date,
         r.status,
         (SELECT q.id FROM service_quotes q
          WHERE q.request_id = r.request_id AND q.partner_id = r.assigned_partner_id
            AND q.status = 'accepted'
          ORDER BY q.id DESC LIMIT 1) AS accepted_quote_id,
          (SELECT q.service_amount FROM service_quotes q WHERE q.request_id = r.request_id AND q.partner_id = r.assigned_partner_id
      AND q.status = 'accepted' ORDER BY q.id DESC LIMIT 1) AS partner_amount,
         EXISTS ( SELECT 1 FROM service_quotes q WHERE q.request_id = r.request_id AND q.partner_id = r.assigned_partner_id
      AND q.status IN ('pending', 'accepted')) AS has_active_quote,
         r.created_at,
       (SELECT UNIX_TIMESTAMP(n.created_at) * 1000 FROM client_notifications n WHERE n.request_id = r.request_id AND n.client_id = r.client_id
   AND n.notification_type = 'service_status' AND n.title = 'Service completed' ORDER BY n.created_at DESC LIMIT 1) AS completed_at_ms,
         c.company_name AS client_company_name,
         c.name AS client_contact_name,
         v.vehicle_number
       FROM vehicle_service_requests r
       LEFT JOIN clients c ON c.client_id = r.client_id
       LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
       WHERE r.assigned_partner_id = ?
         AND r.status IN ('assigned', 'in_progress', 'completed')
       ORDER BY r.preferred_date ASC, r.request_id DESC`,
      [partnerId]
    );

    const paid = await getPaidQuotes(requests.map((request) => request.accepted_quote_id), true)
      .catch((error) => {
        console.error("Load partner payment statuses:", error.message);
        return null;
      });

    return res.json({
      success: true,
      data: requests.map((request) => {
        const { accepted_quote_id, ...details } = request;
        const payment = paid?.get(Number(accepted_quote_id));
        return { ...details, transferReference: payment?.reference, transferredAt: payment?.transferredAt,
          transferredPaise: payment?.transferredPaise, can_start: paid?.has(Number(accepted_quote_id)) ?? false,payment_status_available: paid !== null,};
      }),
    });
  } catch (error) {
    console.error("Get partner jobs:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load partner jobs",
    });
  }
};

const declinePartnerJob = async (req, res) => {
  const partnerId = Number(req.params.partnerId);
  const requestId = Number(req.params.requestId);
  const reason = String(req.body?.reason || "").trim();

  if (
    !Number.isSafeInteger(partnerId) || partnerId <= 0 ||
    !Number.isSafeInteger(requestId) || requestId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner or request ID",
    });
  }

  if (!reason || reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "A decline reason is required (maximum 500 characters)",
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE vehicle_service_requests
       SET status = 'pending',
           assigned_partner_id = NULL,
           assigned_by = NULL,
           assigned_at = NULL,
           partner_decline_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE request_id = ?
         AND assigned_partner_id = ?
         AND status IN ('assigned', 'in_progress')`,
      [reason, requestId, partnerId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message: "This job is no longer assigned to you",
      });
    }

    return res.json({
      success: true,
      message: "Job declined and returned to the admin queue",
      data: { request_id: requestId, status: "pending" },
    });
  } catch (error) {
    console.error("Partner decline job:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to decline this job",
    });
  }
};

const updatePartnerJobStatus = async (req, res) => {
  const partnerId = Number(req.params.partnerId);
  const requestId = Number(req.params.requestId);
  const nextStatus = req.body?.status;

  const expectedCurrentStatus = {
    in_progress: "assigned",
    completed: "in_progress",
  }[nextStatus];

  if (
    !Number.isSafeInteger(partnerId) || partnerId <= 0 ||
    !Number.isSafeInteger(requestId) || requestId <= 0 ||
    !expectedCurrentStatus
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid job status update",
    });
  }

  try {
    let paidQuoteId = null;

    if (nextStatus === "in_progress") {
      const [quotes] = await db.execute(
        "SELECT id FROM service_quotes WHERE request_id = ? AND partner_id = ? " +
          "AND status = 'accepted' ORDER BY id DESC LIMIT 1",
        [requestId, partnerId]
      );

      const quote = quotes[0];
      if (!quote) {
        return res.status(409).json({
          success: false,
          message: "Send a quote and wait for the client to accept it before starting",
        });
      }

      const paid = await getPaidQuotes([quote.id]);
      if (!paid.has(Number(quote.id))) {
        return res.status(409).json({
          success: false,
          message: "Wait for the client's confirmed payment before starting",
        });
      }
      paidQuoteId = quote.id;
    }

    const [result] = await db.query(
      `UPDATE vehicle_service_requests
       SET status = ?, updated_at = UTC_TIMESTAMP(),
       WHERE request_id = ?
         AND assigned_partner_id = ?
         AND status = ?
         AND (? IS NULL OR EXISTS (
           SELECT 1 FROM service_quotes q
           WHERE q.id = ? AND q.request_id = vehicle_service_requests.request_id
             AND q.partner_id = vehicle_service_requests.assigned_partner_id
             AND q.status = 'accepted'
         ))`,
      [nextStatus, requestId, partnerId, expectedCurrentStatus, paidQuoteId, paidQuoteId]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        success: false,
        message:
          nextStatus === "in_progress"
            ? "Only an assigned job can be started"
            : "Only an in-progress job can be completed",
      });
    }
    const [jobRows] = await db.query(
  `SELECT client_id, service_name, request_code
   FROM vehicle_service_requests
   WHERE request_id = ?
   LIMIT 1`,
  [requestId]
);

if (jobRows.length > 0) {
  const job = jobRows[0];
  const completed = nextStatus === "completed";

  try {
    await createClientNotification({
      clientId: job.client_id,
      title: completed ? "Service completed" : "Service started",
      message: `${job.service_name} — request ${job.request_code} is now ${
        completed ? "completed" : "in progress"
      }.`,
      notificationType: "service_status",
      requestId,
    });
  } catch (notificationError) {
    // Status update successful rahega, chahe notification save fail ho.
    console.error("Create service status notification:", notificationError.message);
  }
}
    return res.json({
      success: true,
      message:
        nextStatus === "in_progress" ? "Job started" : "Job completed",
      data: { request_id: requestId, status: nextStatus },
    });
  } catch (error) {
    console.error("Update partner job status:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update job status",
    });
  }
};

module.exports = {getAssignedServiceRequestsForPartner,declinePartnerJob,updatePartnerJobStatus};

