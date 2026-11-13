import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import SectionHeader from "./SectionHeader";
import ProductScroller from "./ProductScroller";
import useProducts from "./useProducts";
import { FireIcon } from "./Icons";

export const LiveBadge = () => (
  <span className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600">
    <span className="h-2 w-2 animate-pulseDot rounded-full bg-red-500" /> LIVE
  </span>
);

const TrendingNow = () => {
  const { categories } = useContext(ShopContext);
  const [cat, setCat] = useState("");
  const { products, loading } = useProducts("/product/trending", { limit: 12, category: cat || undefined }, [cat]);

  return (
    <section>
      <SectionHeader
        title="Trending Now"
        icon={<FireIcon size={26} />}
        subtitle="What shoppers are viewing, saving and buying right now"
        to="/trending"
        right={<LiveBadge />}
      />
      <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
        {[{ name: "", label: "All" }, ...categories.slice(0, 8).map((c) => ({ name: c.name, label: c.name }))].map((c) => (
          <button
            key={c.name || "all"}
            onClick={() => setCat(c.name)}
            className={`shrink-0 rounded-full border px-3.5 py-1 text-xs font-medium sm:text-sm ${cat === c.name ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      {!loading && products.length === 0 ? (
        <p className="rounded-lg bg-white py-10 text-center text-sm text-gray-400">Nothing trending in this category yet.</p>
      ) : (
        <ProductScroller products={products} loading={loading} showRank />
      )}
    </section>
  );
};

export default TrendingNow;
