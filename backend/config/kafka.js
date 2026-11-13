import { Kafka, logLevel } from "kafkajs";

let kafka = null;
let producer = null;
let producerReady = false;

export const kafkaEnabled = () => !!process.env.KAFKA_BROKERS;
export const TOPIC = () => process.env.KAFKA_TOPIC || "shop.events";

export const getKafka = () => {
  if (!kafkaEnabled()) return null;
  if (kafka) return kafka;
  const cfg = {
    clientId: process.env.KAFKA_CLIENT_ID || "trendify-api",
    brokers: process.env.KAFKA_BROKERS.split(",").map((s) => s.trim()),
    logLevel: logLevel.NOTHING,
    retry: { retries: 4, initialRetryTime: 300 },
  };
  if (process.env.KAFKA_SSL === "true") cfg.ssl = true;
  if (process.env.KAFKA_USERNAME) {
    cfg.sasl = { mechanism: "plain", username: process.env.KAFKA_USERNAME, password: process.env.KAFKA_PASSWORD };
  }
  kafka = new Kafka(cfg);
  return kafka;
};

export const connectKafkaProducer = async () => {
  if (kafkaEnabled() && process.env.KAFKA_EMBEDDED_CONSUMER !== "false") {
  startConsumer().catch((e) =>
    console.log("Kafka consumer failed to start:", e.message)
  );
}
  try {
    const k = getKafka();
    const admin = k.admin();
    await admin.connect();
    await admin.createTopics({ waitForLeaders: true, topics: [{ topic: TOPIC(), numPartitions: 3 }] });
    await admin.disconnect();

    producer = k.producer({ allowAutoTopicCreation: false });
    await producer.connect();
    producerReady = true;
    console.log(`Kafka producer connected (topic: ${TOPIC()})`);
  } catch (e) {
    producerReady = false;
    console.log("Kafka unavailable, falling back to in-process events:", e.message);
  }
};

export const sendToKafka = async (events) => {
  if (!producerReady) return false;
  try {
    await producer.send({
      topic: TOPIC(),
      messages: events.map((e) => ({ key: String(e.productId), value: JSON.stringify(e) })),
    });
    return true;
  } catch (e) {
    console.log("Kafka send failed:", e.message);
    return false;
  }
};

export const disconnectKafka = async () => {
  try { if (producer) await producer.disconnect(); } catch {}
};
