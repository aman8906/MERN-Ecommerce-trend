/**
 * npm run seed:images            -> replaces placeholder (picsum) product images + fills empty category images
 * npm run seed:images -- --force -> also re-does category images
 *
 * Source: Pixabay (free API key: https://pixabay.com/api/docs/).
 * Pixabay does not allow permanent hot-linking, so every photo is stored on YOUR side:
 *   - Cloudinary keys set in .env  -> uploaded to Cloudinary (best, works in production)
 *   - otherwise                    -> saved in backend/public/catalog and served from /static/catalog
 * Photos match the product TYPE (e.g. "perfume bottle"), not the exact brand.
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

const KEY = process.env.PIXABAY_API_KEY;
if (!KEY) { console.error("Add PIXABAY_API_KEY=... to backend/.env (free key from pixabay.com/api/docs)"); process.exit(1); }
if (typeof fetch !== "function") { console.error("Node 18 or newer is required (fetch is missing). Check with: node -v"); process.exit(1); }
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "catalog");
const BASE = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY);

// "Category|SubCategory" -> search phrase
const QUERY = {
  "Electronics|Headphones": "wireless headphones",
  "Electronics|Smartwatches": "smartwatch",
  "Electronics|Speakers": "bluetooth speaker",
  "Electronics|Accessories": "phone charger cable",
  "Home & Kitchen|Cookware": "non stick frying pan cookware",
  "Home & Kitchen|Decor": "ceramic vase home decor",
  "Home & Kitchen|Storage": "kitchen storage containers",
  "Home & Kitchen|Bedding": "bedsheet pillow bedroom",
  "Beauty & Care|Skincare": "face serum skincare bottle",
  "Beauty & Care|Makeup": "lipstick makeup",
  "Beauty & Care|Haircare": "hair oil bottle",
  "Beauty & Care|Fragrance": "perfume bottle",
  "Footwear|Sports": "running shoes",
  "Footwear|Sneakers": "white sneakers",
  "Footwear|Formal": "formal leather shoes",
  "Footwear|Sandals": "women sandals",
  "Jewellery|Necklaces": "gold necklace jewellery",
  "Jewellery|Earrings": "earrings jewellery",
  "Jewellery|Rings": "rings jewellery",
  "Jewellery|Bangles": "bangles indian jewellery",
  "Sports & Fitness|Yoga": "yoga mat",
  "Sports & Fitness|Gym": "dumbbells gym",
  "Sports & Fitness|Cricket": "cricket bat ball",
  "Toys & Games|Board Games": "board game",
  "Toys & Games|Soft Toys": "teddy bear toy",
  "Toys & Games|Puzzles": "jigsaw puzzle",
  "Toys & Games|Remote Control": "remote control car toy",
  "Books & Stationery|Notebooks": "notebooks stationery",
  "Books & Stationery|Pens": "colorful gel pens",
  "Books & Stationery|Art Supplies": "acrylic paint set art supplies",
};
const CATEGORY_QUERY = {
  Women: "women fashion clothing", Men: "men fashion clothing", Kids: "kids clothes",
  Electronics: "electronics gadgets", "Home & Kitchen": "home kitchen interior", "Beauty & Care": "beauty cosmetics",
  Footwear: "shoes footwear", Jewellery: "jewellery gold", "Sports & Fitness": "sports fitness equipment",
  "Toys & Games": "toys kids", "Books & Stationery": "books stationery",
};
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; TrendifyImageSeeder/1.0)" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cache = new Map();
class RateLimitError extends Error {}

const search = async (q) => {
  if (cache.has(q)) return cache.get(q);
  const get = async (extra, attempt = 1) => {
    const url = `https://pixabay.com/api/?key=${KEY}&q=${encodeURIComponent(q.slice(0, 100))}&image_type=photo&safesearch=true&per_page=20&min_width=500${extra}`;
    const res = await fetch(url, { headers: HEADERS });
    await sleep(1500); // max ~40 requests/min, Pixabay allows 100 per minute
    if (res.status === 429) {
      if (attempt > 4) throw new RateLimitError("Pixabay rate limit still exceeded. Wait 2 minutes and run the script again, it continues where it stopped.");
      console.log(`  rate limit hit, waiting 65s (attempt ${attempt}/4)...`);
      await sleep(65000);
      return get(extra, attempt + 1);
    }
    if (!res.ok) throw new Error(`Pixabay ${res.status} for "${q}" ${res.status === 400 || res.status === 401 ? "(check PIXABAY_API_KEY)" : ""}`);
    return (await res.json()).hits || [];
  };
  let hits = await get("&orientation=vertical");
  if (hits.length < 4) hits = await get(""); // not enough portrait photos -> allow any
  cache.set(q, hits);
  return hits;
};

/** stores one photo on our side and returns its final URL */
const store = async (hit, name, size = "large") => {
  const src = size === "large" ? hit.largeImageURL : hit.webformatURL;
  if (USE_CLOUDINARY) {
    const r = await cloudinary.uploader.upload(src, { folder: "trendify/catalog", public_id: `${slug(name)}-${hit.id}`, overwrite: false });
    return r.secure_url;
  }
  await fs.mkdir(OUT_DIR, { recursive: true });
  const file = `${slug(name)}-${hit.id}.jpg`;
  const dest = path.join(OUT_DIR, file);
  try { await fs.access(dest); } catch {
    const res = await fetch(src, { headers: HEADERS });
    if (!res.ok) throw new Error(`download failed ${res.status} for ${src}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 2000) throw new Error(`downloaded file too small (${buf.length} bytes), not a real image`);
    await fs.writeFile(dest, buf);
  }
  return `${BASE}/static/catalog/${file}`;
};

/** node seed/fetchImages.js --test  -> checks key + internet + download + write, without touching the database */
const testMode = async () => {
  try {
    console.log("1/3 Asking Pixabay for 'perfume bottle'...");
    const hits = await search("perfume bottle");
    console.log(`    OK, ${hits.length} photos found`);
    if (!hits.length) throw new Error("Pixabay returned 0 photos");
    console.log("2/3 Downloading one photo...");
    const r = await fetch(hits[0].webformatURL, { headers: HEADERS });
    if (!r.ok) throw new Error(`download failed ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    console.log(`    OK, ${Math.round(buf.length / 1024)} KB`);
    console.log("3/3 Writing it to backend/public/catalog/_test.jpg ...");
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(path.join(OUT_DIR, "_test.jpg"), buf);
    console.log(`    OK. With the backend running, open: ${BASE}/static/catalog/_test.jpg`);
    console.log("\nEverything works. Now run:  node seed/fetchImages.js --all");
  } catch (e) {
    console.error("\n✘ TEST FAILED:", e.message, e.cause?.code ? `(${e.cause.code})` : "");
    console.error("  Check: PIXABAY_API_KEY in backend/.env (no quotes/spaces), internet/VPN/firewall, Node 18+.");
  }
  process.exit(0);
};

let pc = 0, cc = 0;
const finish = async (msg) => {
  await Promise.all([cacheDelPrefix("products:"), cacheDelPrefix("categories")]).catch(() => {});
  console.log(msg);
  await mongoose.disconnect();
  process.exit(0);
};

const run = async () => {
  await connectDB();
  connectCloudinary();
  connectRedis();
  const force = process.argv.includes("--force");
  console.log(USE_CLOUDINARY ? "Storing photos on Cloudinary" : `Storing photos in backend/public/catalog (served at ${BASE}/static/catalog)`);

  // ---- products ----
  // default: only products that still have placeholder (picsum) photos
  // --all  : every product OUTSIDE Men/Women/Kids (re-does photos even if already replaced)
  const all = process.argv.includes("--all");
  const filter = all ? { category: { $nin: ["Men", "Women", "Kids"] } } : { image: /picsum\.photos/ };
  const total = await productModel.countDocuments({});
  const products = await productModel.find(filter);
  console.log(`Products in DB: ${total}. To update now: ${products.length}${all ? " (--all)" : " (placeholder photos only)"}`);
  if (total === 0) console.log("-> Database has no products. Run: npm run seed");
  else if (products.length === 0) console.log("-> Nothing has placeholder photos. If you still see old photos, run: node seed/fetchImages.js --all");
  const used = new Map();
  for (const p of products) {
    try {
      const q = QUERY[`${p.category}|${p.subCategory}`] || `${p.subCategory} ${p.category}`;
      const hits = await search(q);
      if (hits.length < 2) { console.log("no photos for", q); continue; }
      const n = used.get(q) || 0; used.set(q, n + 1);
      const a = hits[(n * 2) % hits.length], b = hits[(n * 2 + 1) % hits.length];
      p.image = [await store(a, p.name), await store(b, p.name)];
      await p.save();
      pc++;
      console.log(`✔ ${p.name}  <-  "${q}"`);
    } catch (e) { if (e instanceof RateLimitError) throw e; console.log(`✘ ${p.name}: ${e.message}`); }
  }

  // ---- categories ----
  for (const c of await categoryModel.find({})) {
    if (c.image && !force) continue;
    try {
      const hits = await search(CATEGORY_QUERY[c.name] || c.name);
      if (!hits.length) continue;
      c.image = await store(hits[0], `cat-${c.name}`, "web");
      await c.save();
      cc++;
      console.log(`✔ category ${c.name}`);
    } catch (e) { if (e instanceof RateLimitError) throw e; console.log(`✘ category ${c.name}: ${e.message}`); }
  }

  const sample = await productModel.findOne({ category: { $nin: ["Men", "Women", "Kids"] } }).select("name image").lean();
  if (sample) console.log(`\nSample photo URL (open it in the browser to test): ${sample.image[0]}`);
  await finish(`\nDone: ${pc} products and ${cc} categories updated. Photos from Pixabay (pixabay.com).\nNow RESTART the backend (Ctrl+C, then npm run server) and hard-refresh the browser (Ctrl+Shift+R).`);
};

if (process.argv.includes("--test")) {
  testMode();
} else {
  run().catch((e) => {
    if (e instanceof RateLimitError) return finish(`\n⏸  ${e.message}\nSaved so far: ${pc} products, ${cc} categories.\nRESTART the backend and hard-refresh the browser to see them.`);
    console.error(e.message);
    process.exit(1);
  });
}