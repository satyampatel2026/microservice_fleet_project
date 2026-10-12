const { Kafka, logLevel } = require("kafkajs");
const { handlePartnerEvent } = require("../events/partnerEventHandler");

const kafka = new Kafka({
  clientId: "fleet-partner-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  logLevel: logLevel.ERROR,
});

const consumer = kafka.consumer({
  groupId: "fleet-partner-service-group",
});

const startConsumer = async () => {
  await consumer.connect();

  await consumer.subscribe({
    topic: "fleet.partner.events",
    fromBeginning: false,
  });

  await consumer.run({
   eachMessage: async ({ topic, partition, message }) => {
  if (!message.value) {
    throw new Error("Kafka message value is missing");
  }

  const event = JSON.parse(message.value.toString());

  await handlePartnerEvent(event);

  console.log("Kafka event handled:", {
    topic,
    partition,
    eventType: event.eventType,
    eventId: event.eventId,
  });
},
  });

  console.log("Partner Service Kafka consumer started");
};

const stopConsumer = async () => {
  await consumer.disconnect();
};

module.exports = {
  startConsumer,
  stopConsumer,
};