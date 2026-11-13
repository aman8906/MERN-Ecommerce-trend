// Standalone worker:  npm run worker
import "dotenv/config";
import connectDB from "../config/mongodb.js";
import { connectRedis } from "../config/redis.js";
import { kafkaEnabled } from "../config/kafka.js";
import { startConsumer } from "./consumer.js";

if (!kafkaEnabled()) {
  console.log("KAFKA_BROKERS is not set, nothing to consume.");
  process.exit(0);
}
await connectDB();
connectRedis();
await startConsumer();
