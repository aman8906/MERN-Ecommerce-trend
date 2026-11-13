import React, { useEffect, useState } from "react";
import SectionHeader from "./SectionHeader";
import ProductScroller from "./ProductScroller";
import useProducts from "./useProducts";

const useCountdown = () => {
  const calc = () => {
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const s = Math.max(0, Math.floor((end - Date.now()) / 1000));
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60];
  };
  const [t, setT] = useState(calc);
  useEffect(() => { const i = setInterval(() => setT(calc()), 1000); return () => clearInterval(i); }, []);
  return t;
};

const DealsOfTheDay = () => {
  const { products, loading } = useProducts("/product/deals", {}, []);
  const [h, m, s] = useCountdown();
  if (!loading && products.length === 0) return null;

  return (
    <section className="rounded-2xl bg-gradient-to-r from-brand-light to-orange-50 p-3 sm:p-5">
      <SectionHeader
        title="Deals of the Day"
        subtitle="Biggest discounts, gone at midnight"
        to="/collection?sort=discount&minDiscount=40"
        right={
          <div className="flex items-center gap-1 text-xs font-bold text-white">
            <span className="hidden text-gray-600 sm:inline">Ends in</span>
            {[h, m, s].map((v, i) => (
              <span key={i} className="rounded bg-gray-900 px-1.5 py-1 tabular-nums">{String(v).padStart(2, "0")}</span>
            ))}
          </div>
        }
      />
      <ProductScroller products={products} loading={loading} />
    </section>
  );
};

export default DealsOfTheDay;
