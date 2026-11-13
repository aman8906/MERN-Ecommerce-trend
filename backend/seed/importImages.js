/**
 * Bulk photo importer from a LOCAL folder. Works with any photos you are allowed to use
 * (download them in your browser from pixabay.com / pexels.com / unsplash.com, or use your own).
 *
 *   node seed/importImages.js --folders   -> creates seed/images/<Category>/<SubCategory>/ (no database needed)
 *   node seed/importImages.js             -> uploads those photos and attaches them to the matching products
 *   node seed/importImages.js --fashion   -> also include Men / Women / Kids (skipped by default: they keep your own photos)
 *
 * Needs at least ONE photo per sub-category folder (2 or more is better: the product gets 2 photos).
 * Photos go to Cloudinary if its keys are in .env, otherwise to backend/public/catalog.
 */
import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "images");
const OUT_DIR = path.join(__dirname, "..", "public", "catalog");
const BASE = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY);
const FASHION = ["Men", "Women", "Kids"];
const EXT = /\.(jpe?g|png|webp)$/i;
const flag = (f) => process.argv.includes(f);

// "Category|SubCategory" -> what to search for on a free photo site
const SEARCH = {
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
  "Sports & Fitness|Gym": "dumbbells gym",
  "Sports & Fitness|Cricket": "cricket bat ball",
  "Sports & Fitness|Yoga": "yoga mat",
  "Sports & Fitness|Outdoor": "camping outdoor gear",
  "Toys & Games|Board Games": "board game",
  "Toys & Games|Soft Toys": "teddy bear toy",
  "Toys & Games|Puzzles": "jigsaw puzzle",
  "Toys & Games|Remote Control": "remote control car toy",
  "Books & Stationery|Notebooks": "notebooks stationery",
  "Books & Stationery|Pens": "colorful gel pens",
  "Books & Stationery|Study Books": "textbooks study books",
  "Books & Stationery|Art Supplies": "acrylic paint set art supplies",
};

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const listImages = async (dir) => {
  try { return (await fs.readdir(dir, { withFileTypes: true })).filter((d) => d.isFile() && EXT.test(d.name)).map((d) => path.join(dir, d.name)).sort(); }
  catch { return []; }
};

// ---------- --folders : create the folder tree (no database needed) ----------
if (flag("--folders")) {
  for (const [key, phrase] of Object.entries(SEARCH)) {
    const [cat, sub] = key.split("|");
    const dir = path.join(ROOT, cat, sub);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "_search-this.txt"), `Search on pixabay.com / pexels.com / unsplash.com for:\n${phrase}\nSave 2-4 photos in THIS folder (jpg / png / webp).\n`);
  }
  console.log(`Created ${Object.keys(SEARCH).length} folders under:\n  ${ROOT}\n`);
  console.log("Each folder has a _search-this.txt telling you what to search for.");
  console.log("Put 2+ photos in each folder (even 1 works), then run:  node seed/importImages.js");
  process.exit(0);
}

// ---------- import ----------
const { default: mongoose } = await import("mongoose");
const { v2: cloudinary } = await import("cloudinary");
const { default: connectDB } = await import("../config/mongodb.js");
const { default: connectCloudinary } = await import("../config/cloudinary.js");
const { connectRedis, cacheDelPrefix } = await import("../config/redis.js");
const { default: productModel } = await import("../models/productModel.js");
const { default: categoryModel } = await import("../models/categoryModel.js");

const published = new Map(); // local file -> final url (a photo shared by several products uploads once)
const publish = async (file, key) => {
  if (published.has(file)) return published.get(file);
  let url;
  if (USE_CLOUDINARY) {
    const r = await cloudinary.uploader.upload(file, { folder: "trendify/catalog", public_id: slug(key), overwrite: true, resource_type: "image" });
    url = r.secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_900/"); // smaller + faster for shoppers
  } else {
    await fs.mkdir(OUT_DIR, { recursive: true });
    const name = `${slug(key)}${path.extname(file).toLowerCase()}`;
    await fs.copyFile(file, path.join(OUT_DIR, name));
    url = `${BASE}/static/catalog/${name}`;
  }
  published.set(file, url);
  return url;
};

const run = async () => {
  await connectDB();
  connectCloudinary();
  connectRedis();
  console.log(USE_CLOUDINARY ? "Uploading to Cloudinary" : `Copying to backend/public/catalog (served at ${BASE}/static/catalog)`);

  let updated = 0, covers = 0;
  const missing = [];

  for (const c of await categoryModel.find({})) {
    if (FASHION.includes(c.name) && !flag("--fashion")) continue;
       let coverFile = null;
    // shortcut: photos placed directly in  images/<Category>/  are used for every sub-category that has no photos of its own
    const catFiles = (await listImages(path.join(ROOT, c.name))).filter((f) => !path.basename(f).startsWith("_category"));

    for (const sub of c.subCategories) {
      const subFiles = await listImages(path.join(ROOT, c.name, sub));
      const files = subFiles.length ? subFiles : catFiles;
      if (!files.length) { missing.push(`${c.name}/${sub}`); continue; }
      coverFile = coverFile || files[0];

      const products = await productModel.find({ category: c.name, subCategory: sub }).sort({ date: -1 });
      for (const [n, p] of products.entries()) {
        try {
          const picks = files.length > 1 ? [files[(n * 2) % files.length], files[(n * 2 + 1) % files.length]] : [files[0]];
          const key = (f) => `${c.name}-${sub}-${path.basename(f, path.extname(f))}`;
          p.image = await Promise.all(picks.map(async (f) => publish(f, key(f))));
          await p.save();
          updated++;
          console.log(`✔ ${p.name}`);
        } catch (e) { console.log(`✘ ${p.name}: ${e.message}`); }
      }
    }

    // category cover: ROOT/<Category>/_category.jpg if present, otherwise the first photo found for it
    try {
      const own = (await listImages(path.join(ROOT, c.name))).find((f) => path.basename(f).startsWith("_category"));
      const file = own || coverFile;
      if (file) { c.image = await publish(file, `cat-${c.name}`); await c.save(); covers++; console.log(`✔ category ${c.name}`); }
    } catch (e) { console.log(`✘ category ${c.name}: ${e.message}`); }
  }

  await Promise.all([cacheDelPrefix("products:"), cacheDelPrefix("categories")]).catch(() => {});
  console.log(`\nDone: ${updated} products and ${covers} categories updated.`);
  if (updated === 0) console.log(`\nNothing was updated because no photos were found. Put .jpg/.png/.webp files into:\n  ${ROOT}\\<Category>\\<SubCategory>   (best)\nor directly into  ${ROOT}\\<Category>   (quick shortcut)`);
  if (missing.length) console.log(`\nNo photos yet in ${missing.length} folders (those products keep their old photos):\n  ${missing.join("\n  ")}`);
  console.log("\nNow RESTART the backend (Ctrl+C, then npm run server) and hard-refresh the browser (Ctrl+Shift+R).");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => { console.error(e.message); process.exit(1); });