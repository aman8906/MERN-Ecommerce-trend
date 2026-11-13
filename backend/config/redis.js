import Redis from "ioredis";

/**
 * Thin Redis wrapper with an in-memory fallback.
 * - REDIS_URL set      -> real Redis (shared across instances)
 * - REDIS_URL not set  -> process-local Map (fine for dev, NOT for production)
 * If Redis goes down at runtime every call degrades to the in-memory store
 * instead of crashing the request.
 */
let client = null;
const mem = { kv: new Map(), z: new Map() }; // key -> {v, exp}

const alive = (e) => !e.exp || e.exp > Date.now();
const memGet = (map, key) => {
  const e = map.get(key);
  if (!e) return undefined;
  if (!alive(e)) { map.delete(key); return undefined; }
  return e;
};

export const connectRedis = () => {
  if (!process.env.REDIS_URL) {
    console.log("Redis: REDIS_URL not set, using in-memory fallback (dev only)");
    return null;
  }
  client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableOfflineQueue: false,
    retryStrategy: (n) => Math.min(n * 500, 5000),
  });
  client.on("ready", () => console.log("Redis connected"));
  client.on("error", (e) => console.log("Redis error:", e.message));
  return client;
};

const ready = () => client && client.status === "ready";

const run = async (redisFn, memFn) => {
  if (ready()) {
    try { return await redisFn(client); } catch (e) { console.log("Redis op failed, falling back:", e.message); }
  }
  return memFn();
};

export const redisStatus = () => (ready() ? "redis" : client ? "redis-down(fallback)" : "memory");

// ---------- JSON cache ----------
export const cacheGet = async (key) =>
  run(
    async (r) => { const v = await r.get(key); return v ? JSON.parse(v) : null; },
    () => memGet(mem.kv, key)?.v ?? null
  );

export const cacheSet = async (key, value, ttlSec = 60) =>
  run(
    (r) => r.set(key, JSON.stringify(value), "EX", ttlSec),
    () => { mem.kv.set(key, { v: value, exp: Date.now() + ttlSec * 1000 }); }
  );

export const cacheDelPrefix = async (prefix) =>
  run(
    async (r) => {
      const keys = [];
      for await (const batch of r.scanStream({ match: prefix + "*", count: 200 })) keys.push(...batch);
      if (keys.length) await r.del(...keys);
    },
    () => { for (const k of [...mem.kv.keys()]) if (k.startsWith(prefix)) mem.kv.delete(k); }
  );

/** Cache-aside helper: returns cached value or computes + stores it. */
export const remember = async (key, ttlSec, producer) => {
  const hit = await cacheGet(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await producer();
  await cacheSet(key, fresh, ttlSec);
  return fresh;
};

// ---------- Sorted sets (trending buckets) ----------
export const zincr = async (key, member, inc, ttlSec) =>
  run(
    async (r) => { await r.pipeline().zincrby(key, inc, member).expire(key, ttlSec).exec(); },
    () => {
      let e = memGet(mem.z, key);
      if (!e) { e = { v: new Map(), exp: Date.now() + ttlSec * 1000 }; mem.z.set(key, e); }
      e.v.set(member, (e.v.get(member) || 0) + inc);
    }
  );

/** Top N members (highest score first) as [{member, score}] */
export const ztop = async (key, n = 100) =>
  run(
    async (r) => {
      const flat = await r.zrevrange(key, 0, n - 1, "WITHSCORES");
      const out = [];
      for (let i = 0; i < flat.length; i += 2) out.push({ member: flat[i], score: Number(flat[i + 1]) });
      return out;
    },
    () => {
      const e = memGet(mem.z, key);
      if (!e) return [];
      return [...e.v.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([member, score]) => ({ member, score }));
    }
  );

/** SET NX EX: returns true only the first time within ttl (used to de-duplicate events). */
export const once = async (key, ttlSec) =>
  run(
    async (r) => (await r.set(key, "1", "EX", ttlSec, "NX")) === "OK",
    () => {
      if (memGet(mem.kv, key)) return false;
      mem.kv.set(key, { v: 1, exp: Date.now() + ttlSec * 1000 });
      return true;
    }
  );
