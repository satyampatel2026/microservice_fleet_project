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
         r.created_at,
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

    return res.json({
      success: true,
      data: requests,
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
    const [result] = await db.query(
      `UPDATE vehicle_service_requests
       SET status = ?, updated_at = UTC_TIMESTAMP()
       WHERE request_id = ?
         AND assigned_partner_id = ?
         AND status = ?`,
      [nextStatus, requestId, partnerId, expectedCurrentStatus]
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