const { Kafka, logLevel } = require("kafkajs");

const kafka = new Kafka({
  clientId: "fleet-auth-service",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  logLevel: logLevel.ERROR,
  connectionTimeout: 10000,
  requestTimeout: 30000,
});

const producer = kafka.producer();
let connected = false;

const connectProducer = async () => {
  if (connected) return;

  await producer.connect();
  connected = true;

  console.log("Auth Service Kafka producer connected");
};

const publishEvent = async (topic, key, event) => {
  await connectProducer();

  await producer.send({
    topic,
    messages: [
      {
        key: String(key),
        value: JSON.stringify(event),
      },
    ],
    acks: -1,
  });
};

const disconnectProducer = async () => {
  if (!connected) return;

  await producer.disconnect();
  connected = false;
};

module.exports = {
  publishEvent,
  disconnectProducer,
};