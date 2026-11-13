import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";
import ProductSkeleton from "../components/ProductSkeleton";
import useProducts from "../components/useProducts";
import { FireIcon } from "../components/Icons";
import { LiveBadge } from "../components/TrendingNow";

const Trending = () => {
  const { categories } = useContext(ShopContext);
  const [cat, setCat] = useState("");
  const { products, loading } = useProducts("/product/trending", { limit: 40, category: cat || undefined }, [cat]);

  return (
    <div className="py-4">
      <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 p-5 text-white sm:p-8">
        <div className="flex items-center gap-2"><LiveBadge /></div>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-extrabold sm:text-4xl"><FireIcon size={34} /> Trending Now</h1>
        <p className="mt-1 text-sm opacity-90 sm:text-base">Ranked by what shoppers viewed, saved and bought in the last 24 hours. Updated every minute.</p>
      </div>
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {[{ name: "", label: "All" }, ...categories.map((c) => ({ name: c.name, label: `${c.icon} ${c.name}` }))].map((c) => (
          <button key={c.name || "all"} onClick={() => setCat(c.name)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${cat === c.name ? "border-brand bg-brand text-white" : "border-gray-200 bg-white text-gray-600 hover:border-brand"}`}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {loading ? <ProductSkeleton count={10} /> : products.map((p, i) => <ProductItem key={p._id} product={p} rank={i + 1} />)}
      </div>
      {!loading && !products.length && <p className="py-20 text-center text-gray-400">Nothing trending here yet. Check back soon.</p>}
    </div>
  );
};

export default Trending;
