/**
 * Moves your original Men / Women / Kids photos (backend/public/seed/*.png) to Cloudinary
 * and rewrites the URLs saved in the database. Works whatever the old prefix was
 * (http://localhost:4000, https://api.yourdomain.com ...): it only looks for  /static/seed/<file>
 *
 *   node seed/moveSeedToCloudinary.js --dry   -> only shows what would happen
 *   node seed/moveSeedToCloudinary.js         -> uploads and updates the database
 *
 * Run it on YOUR laptop (it needs the files in backend/public/seed and Cloudinary keys in backend/.env).
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import connectDB from "../config/mongodb.js";
import connectCloudinary from "../config/cloudinary.js";
import { connectRedis, cacheDelPrefix } from "../config/redis.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import bannerModel from "../models/bannerModel.js";

const dry = process.argv.includes("--dry");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, "..", "public", "seed");
const FILE_RX = /\/static\/seed\/([^/?#]+)$/;

if (!dry && !(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY)) {
  console.error("Cloudinary keys are missing in backend/.env"); process.exit(1);
}

const uploaded = new Map(); // file name -> new url (a photo used twice uploads once)
const toCloudinary = async (url) => {
  const m = FILE_RX.exec(url || "");
  if (!m) return url; // already a Cloudinary / other URL: leave as is
  const name = decodeURIComponent(m[1]);
  if (uploaded.has(name)) return uploaded.get(name);
  const file = path.join(SEED_DIR, name);
  try { await fs.access(file); } catch { console.log(`  ✘ file not found: ${file}`); return url; }
  if (dry) { uploaded.set(name, url); return url; }
  const r = await cloudinary.uploader.upload(file, { folder: "trendify/fashion", public_id: name.replace(/\.[^.]+$/, ""), overwrite: true, resource_type: "image" });
  const out = r.secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_900/");
  uploaded.set(name, out);
  console.log(`  ✔ ${name}`);
  return out;
};

await connectDB();
if (!dry) { connectCloudinary(); connectRedis(); }

let products = 0, cats = 0, banners = 0;

for (const p of await productModel.find({ image: /\/static\/seed\// }).lean()) {
  const image = [];
  for (const u of p.image) image.push(await toCloudinary(u));
  if (!dry) await productModel.updateOne({ _id: p._id }, { $set: { image } });
  products++;
}
for (const c of await categoryModel.find({ image: /\/static\/seed\// }).lean()) {
  const image = await toCloudinary(c.image);
  if (!dry) await categoryModel.updateOne({ _id: c._id }, { $set: { image } });
  cats++;
}
for (const b of await bannerModel.find({ image: /\/static\/seed\// }).lean()) {
  const image = await toCloudinary(b.image);
  if (!dry) await bannerModel.updateOne({ _id: b._id }, { $set: { image } });
  banners++;
}

console.log(`\n${dry ? "DRY RUN (nothing changed): " : ""}${products} products, ${cats} categories, ${banners} banners, ${uploaded.size} different photos`);
if (!dry) {
  await new Promise((r) => setTimeout(r, 1500));
  await Promise.all([cacheDelPrefix("products:"), cacheDelPrefix("categories"), cacheDelPrefix("banners")]).catch(() => {});
  console.log("Done. The live site may take 1-5 minutes to show them (cache). Then press Ctrl+Shift+R.");
}
await mongoose.disconnect();
process.exit(0);