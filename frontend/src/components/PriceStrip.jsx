import React from "react";
import { Link } from "react-router-dom";

const TILES = [
  { max: 199, label: "Under ₹199", sub: "Steal deals", bg: "from-pink-500 to-rose-500" },
  { max: 499, label: "Under ₹499", sub: "Budget picks", bg: "from-violet-500 to-fuchsia-600" },
  { max: 999, label: "Under ₹999", sub: "Best value", bg: "from-orange-500 to-amber-500" },
  { max: 1999, label: "Under ₹1999", sub: "Premium for less", bg: "from-emerald-500 to-teal-600" },
];

/** Meesho-style budget store */
const PriceStrip = () => (
  <section>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TILES.map((t) => (
        <Link key={t.max} to={`/collection?maxPrice=${t.max}&sort=price_asc`} className={`rounded-xl bg-linear-to-br ${t.bg} p-4 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:p-5`}>
          <p className="text-lg font-extrabold sm:text-2xl">{t.label}</p>
          <p className="text-xs opacity-90 sm:text-sm">{t.sub} →</p>
        </Link>
      ))}
    </div>
  </section>
);

export default PriceStrip;