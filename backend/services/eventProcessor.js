import productModel from "../models/productModel.js";
import { recordSignal, SIGNAL_WEIGHT } from "./trending.js";

/**
 * Shared by the Kafka consumer AND the in-process fallback, so behaviour is identical.
 * Takes a batch, updates Redis trending buckets and writes ONE Mongo bulk update
 * (instead of one write per click).
 */
const FIELD = { view: "views", add_to_cart: "cartAdds", wishlist: "wishlists", purchase: "sold" };

export const processEvents = async (events) => {
  const inc = new Map(); // productId -> { field: n, popularity: n }

  for (const e of events) {
    if (!e?.productId || !SIGNAL_WEIGHT[e.type]) continue;
    const qty = Math.max(1, Number(e.qty) || 1);
    await recordSignal(e.productId, e.type, qty, e.ts || Date.now());

    const row = inc.get(e.productId) || {};
    row[FIELD[e.type]] = (row[FIELD[e.type]] || 0) + qty;
    row.popularity = (row.popularity || 0) + SIGNAL_WEIGHT[e.type] * qty;
    inc.set(e.productId, row);
  }

  if (inc.size) {
    await productModel.bulkWrite(
      [...inc.entries()].map(([id, $inc]) => ({ updateOne: { filter: { _id: id }, update: { $inc } } })),
      { ordered: false }
    );
  }
};
