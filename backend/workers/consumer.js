import { getKafka, TOPIC } from "../config/kafka.js";
import { processEvents } from "../services/eventProcessor.js";

/** Kafka consumer: batches events and hands them to processEvents(). */
export const startConsumer = async () => {
  const kafka = getKafka();
  if (!kafka) return null;

  const consumer = kafka.consumer({ groupId: "trending-workers" });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC(), fromBeginning: false });

  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary }) => {
      const events = [];
      for (const m of batch.messages) {
        try { events.push(JSON.parse(m.value.toString())); } catch {}
      }
      await processEvents(events);
      // only mark offsets after the batch is safely processed (at-least-once)
      resolveOffset(batch.messages[batch.messages.length - 1].offset);
      await commitOffsetsIfNecessary();
      await heartbeat();
    },
  });

  console.log(`Kafka consumer running (group: trending-workers, topic: ${TOPIC()})`);
  return consumer;
};
