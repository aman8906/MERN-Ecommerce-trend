import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import useProducts from "./useProducts";
import { money } from "../utils/format";

/** Flipkart-style tile: category title + 2x2 grid of its best products */
const Tile = ({ cat }) => {
  const { products, loading } = useProducts("/product/list", { category: cat.name, sort: "popular", limit: 4 }, [cat.name]);
  if (!loading && products.length === 0) return null;

  return (
    <div className="rounded-xl border bg-white p-3 shadow-xs sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold text-gray-900 sm:text-lg">{cat.icon} {cat.name}</h3>
        <Link to={`/collection?category=${encodeURIComponent(cat.name)}`} className="text-xs font-semibold text-brand hover:underline sm:text-sm">See all</Link>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {(loading ? Array.from({ length: 4 }) : products).map((p, i) =>
          p ? (
            <Link key={p._id} to={`/product/${p._id}`} className="group block">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={p.image[0]} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <p className="mt-1 line-clamp-1 text-xs text-gray-600">{p.subCategory || p.name}</p>
              <p className="text-xs font-bold text-good sm:text-sm">
                {p.discountPercent >= 10 ? `${p.discountPercent}% off` : `From ${money(p.price)}`}
              </p>
            </Link>
          ) : (
            <div key={i} className="skeleton aspect-square rounded-lg" />
          )
        )}
      </div>
    </div>
  );
};

const CategoryShowcase = () => {
  const { categories } = useContext(ShopContext);
  if (!categories.length) return null;
  return (
    <section>
      <h2 className="mb-3 text-lg font-bold text-gray-900 sm:text-2xl">Top picks in every category</h2>
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {categories.slice(0, 8).map((c) => <Tile key={c._id} cat={c} />)}
      </div>
    </section>
  );
};

export default CategoryShowcase;