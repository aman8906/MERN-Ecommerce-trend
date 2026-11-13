import { zincr, ztop, cacheGet, cacheSet } from "../config/redis.js";
import productModel from "../models/productModel.js";

/**
 * "Trending now" = recency-weighted activity.
 *  - every event adds weight to the CURRENT hourly bucket (a Redis sorted set)
 *  - when reading, the last 24 buckets are blended with exponential decay,
 *    so a product that spiked 20h ago ranks below one that is hot right now.
 */
export const SIGNAL_WEIGHT = { view: 1, wishlist: 3, add_to_cart: 5, purchase: 10 };
const HOURS = 24;
const DECAY = 0.92; // per hour
const BUCKET_TTL = 48 * 3600;

const bucketKey = (ts) => `trending:h:${new Date(ts).toISOString().slice(0, 13)}`;

export const recordSignal = (productId, type, qty = 1, ts = Date.now()) => {
  const w = SIGNAL_WEIGHT[type];
  if (!w) return Promise.resolve();
  return zincr(bucketKey(ts), String(productId), w * qty, BUCKET_TTL);
};

const computeScores = async () => {
  const now = Date.now();
  const buckets = await Promise.all(
    Array.from({ length: HOURS }, (_, i) => ztop(bucketKey(now - i * 3600e3), 200))
  );
  const scores = new Map();
  buckets.forEach((rows, i) => {
    const decay = Math.pow(DECAY, i);
    for (const { member, score } of rows) scores.set(member, (scores.get(member) || 0) + score * decay);
  });
  return [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100);
};

/** Ranked list of trending products ({product, score}) */
export const getTrending = async ({ category, limit = 20 } = {}) => {
  let ranked = await cacheGet("trending:scores");
  if (!ranked) {
    ranked = await computeScores();
    await cacheSet("trending:scores", ranked, 60); // recompute at most once a minute
  }

  const ids = ranked.map(([id]) => id);
  const filter = { isActive: true };
  if (category) filter.category = category;

  // hot products + admin-pinned products + popularity fallback (fresh DB / no events yet)
  const [hot, pinned, fallback] = await Promise.all([
    ids.length ? productModel.find({ ...filter, _id: { $in: ids } }).lean() : [],
    productModel.find({ ...filter, trendingPin: true }).limit(6).lean(),
    productModel.find(filter).sort({ popularity: -1, date: -1 }).limit(limit).lean(),
  ]);

  const scoreOf = new Map(ranked);
  const merged = new Map();
  for (const p of hot) merged.set(String(p._id), { ...p, trendScore: scoreOf.get(String(p._id)) || 0 });
  for (const p of pinned) {
    const k = String(p._id);
    merged.set(k, { ...(merged.get(k) || p), trendScore: (scoreOf.get(k) || 0) + 25 });
  }
  // fallback only fills the empty slots, with scores always below real activity
  let filler = 0;
  for (const p of fallback) {
    const k = String(p._id);
    if (!merged.has(k)) merged.set(k, { ...p, trendScore: filler++ * 0.001 });
  }

  return [...merged.values()]
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limit)
    .map((p, i) => ({ ...p, trendRank: i + 1 }));
};
