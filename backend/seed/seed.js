/**
 * npm run seed         -> adds categories + products only if the DB has no products
 * npm run seed:reset   -> wipes categories/products/banners/reviews first, then seeds
 *
 * - Your original 52 fashion products come from seed/fashionProducts.json
 *   (images are served by this API from /static/seed/*.png)
 * - Demo products for the NEW categories use placeholder images (picsum.photos).
 *   Replace them from the admin panel with real product photos.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import connectDB from "../config/mongodb.js";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import bannerModel from "../models/bannerModel.js";
import reviewModel from "../models/reviewModel.js";
import { calcDiscount } from "../utils/pricing.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;

const categories = [
  { name: "Women", icon: "👗", subCategories: ["Topwear", "Bottomwear", "Winterwear"] },
  { name: "Men", icon: "👔", subCategories: ["Topwear", "Bottomwear", "Winterwear"] },
  { name: "Kids", icon: "🧸", subCategories: ["Topwear", "Bottomwear", "Winterwear"] },
  { name: "Electronics", icon: "🎧", subCategories: ["Headphones", "Smartwatches", "Speakers", "Accessories"] },
  { name: "Home & Kitchen", icon: "🏠", subCategories: ["Cookware", "Decor", "Storage", "Bedding"] },
  { name: "Beauty & Care", icon: "💄", subCategories: ["Skincare", "Makeup", "Haircare", "Fragrance"] },
  { name: "Footwear", icon: "👟", subCategories: ["Sneakers", "Sandals", "Formal", "Sports"] },
  { name: "Jewellery", icon: "💍", subCategories: ["Necklaces", "Earrings", "Rings", "Bangles"] },
  { name: "Sports & Fitness", icon: "🏏", subCategories: ["Gym", "Cricket", "Yoga", "Outdoor"] },
  { name: "Toys & Games", icon: "🎮", subCategories: ["Board Games", "Soft Toys", "Puzzles", "Remote Control"] },
  { name: "Books & Stationery", icon: "📚", subCategories: ["Notebooks", "Pens", "Study Books", "Art Supplies"] },
].map((c, i) => ({ ...c, order: i }));

// [name, category, subCategory, brand, price, mrp, sizes?]
const demo = [
  ["boAt Rockerz 450 Bluetooth Headphones", "Electronics", "Headphones", "boAt", 1299, 3990],
  ["Noise ColorFit Pulse Smartwatch", "Electronics", "Smartwatches", "Noise", 1799, 5999],
  ["Portable Bluetooth Speaker 10W", "Electronics", "Speakers", "Zebronics", 899, 2499],
  ["Fast Charging Type-C Cable 1.5m", "Electronics", "Accessories", "Ambrane", 199, 599],
  ["Non-Stick Cookware Set 3 Pcs", "Home & Kitchen", "Cookware", "Prestige", 1499, 3200],
  ["Ceramic Table Vase Set of 2", "Home & Kitchen", "Decor", "Urban Nest", 499, 1299],
  ["Airtight Storage Containers 6 Pcs", "Home & Kitchen", "Storage", "Cello", 649, 1250],
  ["Double Bedsheet with 2 Pillow Covers", "Home & Kitchen", "Bedding", "Home Story", 599, 1999],
  ["Vitamin C Face Serum 30ml", "Beauty & Care", "Skincare", "Minimalist", 549, 699],
  ["Matte Liquid Lipstick Combo of 4", "Beauty & Care", "Makeup", "Sugar", 399, 1199],
  ["Onion Hair Oil 250ml", "Beauty & Care", "Haircare", "WOW", 329, 649],
  ["Eau de Parfum for Men 100ml", "Beauty & Care", "Fragrance", "Engage", 449, 999],
  ["Men Running Sports Shoes", "Footwear", "Sports", "Campus", 999, 2499, ["6", "7", "8", "9", "10"]],
  ["Women Casual White Sneakers", "Footwear", "Sneakers", "Bata", 849, 1999, ["5", "6", "7", "8"]],
  ["Men Formal Derby Shoes", "Footwear", "Formal", "Red Tape", 1299, 3499, ["7", "8", "9", "10"]],
  ["Women Flat Sandals", "Footwear", "Sandals", "Walkway", 349, 899, ["5", "6", "7", "8"]],
  ["Gold Plated Layered Necklace Set", "Jewellery", "Necklaces", "Zaveri", 399, 1299],
  ["Oxidised Silver Jhumka Earrings", "Jewellery", "Earrings", "Priyaasi", 249, 799],
  ["Adjustable Stone Ring Set of 5", "Jewellery", "Rings", "Zaveri", 299, 899],
  ["Traditional Glass Bangles Box of 24", "Jewellery", "Bangles", "Kundan", 349, 999],
  ["Anti-Slip Yoga Mat 6mm", "Sports & Fitness", "Yoga", "Boldfit", 499, 1499],
  ["Adjustable Dumbbell Set 10kg", "Sports & Fitness", "Gym", "Kore", 1399, 2999],
  ["Kashmir Willow Cricket Bat", "Sports & Fitness", "Cricket", "SG", 1899, 3499],
  ["Family Ludo & Snake Ladder Board", "Toys & Games", "Board Games", "Funskool", 249, 599],
  ["Soft Teddy Bear 60cm", "Toys & Games", "Soft Toys", "Toyzone", 599, 1499],
  ["1000 Piece Jigsaw Puzzle", "Toys & Games", "Puzzles", "Ravensburger", 699, 1199],
  ["Remote Control Racing Car", "Toys & Games", "Remote Control", "Hot Wheels", 799, 1999],
  ["A5 Ruled Notebooks Pack of 6", "Books & Stationery", "Notebooks", "Classmate", 299, 540],
  ["Gel Pens Set of 20 Colours", "Books & Stationery", "Pens", "Cello", 149, 349],
  ["Acrylic Paint Set 24 Colours", "Books & Stationery", "Art Supplies", "Camlin", 349, 799],
];

// deterministic pseudo-random so every seed run looks the same
let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const between = (a, b) => Math.floor(a + rnd() * (b - a + 1));
const round9 = (n) => Math.max(9, Math.round(n / 10) * 10 - 1);

const withStats = (p) => {
  const views = between(80, 4000), cartAdds = between(5, Math.floor(views / 6)), wishlists = between(2, Math.floor(views / 10)), sold = between(3, Math.floor(cartAdds / 1.5));
  return {
    ...p,
    discountPercent: calcDiscount(p.price, p.mrp),
    rating: Math.round((3.6 + rnd() * 1.1) * 10) / 10,
    ratingCount: between(12, 2400),
    stock: between(8, 120),
    views, cartAdds, wishlists, sold,
    popularity: views + cartAdds * 5 + wishlists * 3 + sold * 10 + (p.bestSeller ? 400 : 0),
    isActive: true,
  };
};

const build = () => {
  const fashion = JSON.parse(fs.readFileSync(path.join(__dirname, "fashionProducts.json"), "utf8")).map((p) => {
    const price = round9(p.price * 5); // original demo prices were 100-200
    const mrp = round9(price * (1.3 + rnd() * 0.9));
    return withStats({
      name: p.name, description: p.description, category: p.category, subCategory: p.subCategory, sizes: p.sizes,
      brand: "Trendify", tags: [p.category.toLowerCase(), p.subCategory.toLowerCase(), "fashion"],
      image: p.image.map((f) => `${BASE}/static/seed/${f}`),
      price, mrp, bestSeller: !!p.bestseller, date: p.date,
    });
  });

  const now = Date.now();
  const others = demo.map(([name, category, subCategory, brand, price, mrp, sizes], i) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return withStats({
      name, category, subCategory, brand, price, mrp, sizes: sizes || [],
      description: `${name} by ${brand}. Quality assured, easy returns and fast delivery. (Demo product, replace the image and details from the admin panel.)`,
      tags: [category.toLowerCase(), subCategory.toLowerCase(), brand.toLowerCase()],
      image: [`https://picsum.photos/seed/${slug}/600/750`, `https://picsum.photos/seed/${slug}-2/600/750`],
      bestSeller: i % 4 === 0, date: now - i * 3600e3 * 7,
    });
  });
  // pin a few so "Trending now" looks alive even before real traffic
  others.filter((_, i) => i % 6 === 0).forEach((p) => (p.trendingPin = true));
  return [...fashion, ...others];
};

const run = async () => {
  await connectDB();
  if (process.argv.includes("--reset")) {
    await Promise.all([productModel.deleteMany({}), categoryModel.deleteMany({}), bannerModel.deleteMany({}), reviewModel.deleteMany({})]);
    console.log("Cleared categories, products, banners, reviews");
  }
  if ((await productModel.countDocuments()) > 0) {
    console.log("Products already exist. Use `npm run seed:reset` to start fresh.");
  } else {
    for (const c of categories) await categoryModel.updateOne({ name: c.name }, { $setOnInsert: c }, { upsert: true });
    const products = build();
    await productModel.insertMany(products);
    console.log(`Seeded ${categories.length} categories and ${products.length} products`);
    console.log("Next: run  node seed/fetchImages.js  to replace the placeholder photos with real ones.");
  }
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
