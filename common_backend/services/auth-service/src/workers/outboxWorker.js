const authDb = require("../model/authDb");
const { publishEvent } = require("../config/kafka");

const publishPendingEvents = async () => {
  const [events] = await authDb.query(
    `SELECT id, event_id, topic, event_key, event_type, payload
     FROM outbox_events
     WHERE status = 'pending'
     ORDER BY id ASC
     LIMIT 50`
  );

  for (const event of events) {
    try {
      const payload =
        typeof event.payload === "string"
          ? JSON.parse(event.payload)
          : event.payload;

      await publishEvent(event.topic, event.event_key, {
        ...payload,
        eventId: event.event_id,
        eventType: event.event_type,
      });

      await authDb.query(
        `UPDATE outbox_events
         SET status = 'published',
             published_at = NOW(),
             attempts = attempts + 1
         WHERE id = ? AND status = 'pending'`,
        [event.id]
      );

      console.log("Kafka event published:", event.event_type);
    } catch (error) {
      await authDb.query(
        `UPDATE outbox_events
         SET attempts = attempts + 1
         WHERE id = ? AND status = 'pending'`,
        [event.id]
      );

      console.error(
        `Outbox event ${event.id} failed:`,
        error.message
      );
    }
  }
};

let running = false;
let processingPromise = null;

const startOutboxWorker = () => {
  if (running) return;

  running = true;

  const timer = setInterval(() => {
    if (!running || processingPromise) return;

    processingPromise = publishPendingEvents()
      .catch((error) => {
        console.error("Outbox worker error:", error.message);
      })
      .finally(() => {
        processingPromise = null;
      });
  }, 3000);

  return async () => {
    // Prevent new processing cycles
    running = false;
    clearInterval(timer);

    // Wait for current processing to finish
    if (processingPromise) {
      await processingPromise;
    }

    console.log("Auth Service Outbox Worker stopped");
  };
};
module.exports = {
  startOutboxWorker,
};