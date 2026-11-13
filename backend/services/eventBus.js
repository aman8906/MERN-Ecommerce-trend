import { sendToKafka, kafkaEnabled } from "../config/kafka.js";
import { processEvents } from "./eventProcessor.js";

/**
 * publishEvents: the only function the rest of the app uses.
 *  Kafka up    -> event goes to Kafka, a consumer (embedded or `npm run worker`) processes it
 *  Kafka down / not configured -> processed in-process so nothing is lost
 * Never throws: analytics must not break a checkout.
 */
export const publishEvents = async (events) => {
  const list = (Array.isArray(events) ? events : [events]).map((e) => ({ ts: Date.now(), ...e }));
  try {
    if (kafkaEnabled() && (await sendToKafka(list))) return;
    await processEvents(list);
  } catch (e) {
    console.log("publishEvents failed:", e.message);
  }
};
