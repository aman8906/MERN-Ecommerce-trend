import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import { connectRedis, redisStatus } from "./config/redis.js";
import { connectKafkaProducer, kafkaEnabled, disconnectKafka } from "./config/kafka.js";
import { startConsumer } from "./workers/consumer.js";
import { shippingConfig } from "./utils/pricing.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import categoryRouter from "./routes/categoryRoute.js";
import bannerRouter from "./routes/bannerRoute.js";
import cartRouter from "./routes/cartRoute.js";
import wishlistRouter from "./routes/wishlistRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import orderRouter from "./routes/orderRoute.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 4000;

await connectDB();
connectCloudinary();
connectRedis();
await connectKafkaProducer();
if (kafkaEnabled() && process.env.KAFKA_EMBEDDED_CONSUMER !== "false") {
  startConsumer().catch((e) => console.log("Kafka consumer failed to start:", e.message));
}

// INFO: Middleware
app.set("trust proxy", 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(express.json({ limit: "1mb" }));
const origins = [process.env.FRONTEND_URL, process.env.ADMIN_URL, "http://localhost:5173", "http://localhost:5174"].filter(Boolean);
app.use(cors({ origin: origins }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));
app.use("/api/user/login", rateLimit({ windowMs: 15 * 60_000, limit: 20 }));
app.use("/api/user/admin", rateLimit({ windowMs: 15 * 60_000, limit: 10 }));
app.use("/static", express.static(path.join(__dirname, "public"), { maxAge: "7d" }));

// INFO: API endpoints
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/category", categoryRouter);
app.use("/api/banner", bannerRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/review", reviewRouter);
app.use("/api/order", orderRouter);
app.get("/api/config", (req, res) => res.json({ success: true, currency: "₹", ...shippingConfig() }));

app.get("/", (req, res) =>
  res.json({ status: "API is running...", cache: redisStatus(), kafka: kafkaEnabled() ? "enabled" : "in-process" })
);

// INFO: Error handler (multer errors, bad JSON, etc.)
app.use((err, req, res, next) => {
  console.log("Unhandled error:", err.message);
  res.status(err.status || 400).json({ success: false, message: err.message });
});

app.listen(port,"0.0.0.0", () => console.log(`Server is running on at http://localhost:${port}`));

process.on("SIGTERM", async () => { await disconnectKafka(); process.exit(0); });
