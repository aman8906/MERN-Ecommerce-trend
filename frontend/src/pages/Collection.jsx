import React, { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import api from "../api";
import ProductItem from "../components/ProductItem";
import ProductSkeleton from "../components/ProductSkeleton";
import { FilterIcon, CloseIcon } from "../components/Icons";

const PRICES = [
  { label: "Under ₹500", min: "", max: 500 },
  { label: "₹500 – ₹1,000", min: 500, max: 1000 },
  { label: "₹1,000 – ₹2,000", min: 1000, max: 2000 },
  { label: "Above ₹2,000", min: 2000, max: "" },
];
const SORTS = [
  ["popular", "Popularity"], ["newest", "What's New"], ["price_asc", "Price: Low to High"],
  ["price_desc", "Price: High to Low"], ["discount", "Better Discount"], ["rating", "Customer Rating"],
];

const Collection = () => {
  const { categories, cacheProducts } = useContext(ShopContext);
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(false);

  const category = params.get("category") || "";
  const subCategory = params.get("subCategory") || "";
  const search = params.get("search") || "";
  const sort = params.get("sort") || "popular";
  const minPrice = params.get("minPrice") || "";
  const maxPrice = params.get("maxPrice") || "";
  const rating = params.get("rating") || "";
  const minDiscount = params.get("minDiscount") || "";
  const activeCat = categories.find((c) => c.name === category);

  const setParam = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const clearAll = () => setParams(search ? { search } : {}, { replace: true });

  const filterKey = [category, subCategory, search, sort, minPrice, maxPrice, rating, minDiscount].join("|");

  useEffect(() => { setPage(1); }, [filterKey]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.get("/product/list", { params: { category, subCategory, search, sort, minPrice, maxPrice, rating, minDiscount, page, limit: 20 } })
      .then((r) => {
        if (!live || !r.data.success) return;
        cacheProducts(r.data.products);
        setItems((prev) => (page === 1 ? r.data.products : [...prev, ...r.data.products]));
        setMeta({ total: r.data.total, pages: r.data.pages });
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line
  }, [filterKey, page]);

  const hasFilters = category || subCategory || minPrice || maxPrice || rating || minDiscount;

  const Filters = (
    <div className="space-y-6 text-sm">
      <div>
        <p className="mb-2 font-semibold text-gray-900">Category</p>
        <div className="space-y-1">
          <button onClick={() => setParam({ category: "", subCategory: "" })} className={`block w-full rounded px-2 py-1 text-left ${!category ? "bg-brand-light font-medium text-brand" : "text-gray-600 hover:bg-gray-50"}`}>All categories</button>
          {categories.map((c) => (
            <div key={c._id}>
              <button onClick={() => setParam({ category: c.name, subCategory: "" })} className={`block w-full rounded px-2 py-1 text-left ${category === c.name ? "bg-brand-light font-medium text-brand" : "text-gray-600 hover:bg-gray-50"}`}>
                {c.icon} {c.name}
              </button>
              {category === c.name && c.subCategories.length > 0 && (
                <div className="ml-5 mt-1 space-y-1 border-l pl-3">
                  {c.subCategories.map((s) => (
                    <button key={s} onClick={() => setParam({ subCategory: subCategory === s ? "" : s })} className={`block w-full text-left ${subCategory === s ? "font-semibold text-brand" : "text-gray-500 hover:text-gray-800"}`}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-semibold text-gray-900">Price</p>
        <div className="space-y-1.5">
          {PRICES.map((p) => {
            const on = String(p.min) === minPrice && String(p.max) === maxPrice;
            return (
              <label key={p.label} className="flex cursor-pointer items-center gap-2 text-gray-600">
                <input type="radio" name="price" checked={on} onChange={() => setParam({ minPrice: p.min, maxPrice: p.max })} className="accent-brand" />
                {p.label}
              </label>
            );
          })}
        </div>
      </div>
      <div>
        <p className="mb-2 font-semibold text-gray-900">Customer rating</p>
        {[4, 3].map((r) => (
          <label key={r} className="mb-1.5 flex cursor-pointer items-center gap-2 text-gray-600">
            <input type="radio" name="rating" checked={rating === String(r)} onChange={() => setParam({ rating: r })} className="accent-brand" />
            {r}★ & above
          </label>
        ))}
      </div>
      <div>
        <p className="mb-2 font-semibold text-gray-900">Discount</p>
        {[50, 30, 10].map((d) => (
          <label key={d} className="mb-1.5 flex cursor-pointer items-center gap-2 text-gray-600">
            <input type="radio" name="disc" checked={minDiscount === String(d)} onChange={() => setParam({ minDiscount: d })} className="accent-brand" />
            {d}% or more
          </label>
        ))}
      </div>
      {hasFilters && <button onClick={clearAll} className="w-full rounded-lg border border-brand py-2 font-semibold text-brand hover:bg-brand hover:text-white">Clear all filters</button>}
    </div>
  );

  return (
    <div className="py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold sm:text-2xl">
            {search ? <>Results for "{search}"</> : subCategory ? `${category} · ${subCategory}` : category || "All Products"}
          </h1>
          <p className="text-xs text-gray-500">{loading && page === 1 ? "Loading…" : `${meta.total} products`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawer(true)} className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium lg:hidden">
            <FilterIcon size={16} /> Filters {hasFilters && <span className="h-2 w-2 rounded-full bg-brand" />}
          </button>
          <select value={sort} onChange={(e) => setParam({ sort: e.target.value })} className="rounded-lg border bg-white px-2 py-1.5 text-sm outline-none">
            {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
          </select>
        </div>
      </div>

      {activeCat?.subCategories.length > 0 && (
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
          {activeCat.subCategories.map((s) => (
            <button key={s} onClick={() => setParam({ subCategory: subCategory === s ? "" : s })} className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${subCategory === s ? "border-brand bg-brand text-white" : "bg-white text-gray-600"}`}>{s}</button>
          ))}
        </div>
      )}

      <div className="flex gap-6">
        <aside className="sticky top-32 hidden h-fit w-60 shrink-0 rounded-lg border bg-white p-4 lg:block">{Filters}</aside>
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => <ProductItem key={p._id} product={p} />)}
            {loading && <ProductSkeleton count={page === 1 ? 8 : 4} />}
          </div>
          {!loading && items.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-2 font-medium text-gray-700">No products found</p>
              <p className="text-sm text-gray-400">Try changing or clearing the filters</p>
              {hasFilters && <button onClick={clearAll} className="mt-4 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white">Clear filters</button>}
            </div>
          )}
          {!loading && page < meta.pages && (
            <div className="mt-6 text-center">
              <button onClick={() => setPage((p) => p + 1)} className="rounded-full border border-brand px-8 py-2.5 text-sm font-semibold text-brand hover:bg-brand hover:text-white">Load more</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 pb-24">
            <div className="mb-3 flex items-center justify-between"><p className="text-lg font-bold">Filters</p><button onClick={() => setDrawer(false)}><CloseIcon /></button></div>
            {Filters}
            <button onClick={() => setDrawer(false)} className="fixed inset-x-4 bottom-4 rounded-lg bg-brand py-3 font-semibold text-white">Show {meta.total} products</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collection;
