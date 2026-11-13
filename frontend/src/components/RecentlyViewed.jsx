import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import api from "../api";
import SectionHeader from "./SectionHeader";
import ProductScroller from "./ProductScroller";

const RecentlyViewed = ({ excludeId }) => {
  const { getRecent, cacheProducts } = useContext(ShopContext);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const ids = getRecent().filter((id) => id !== excludeId).slice(0, 10);
    if (!ids.length) return;
    api.post("/product/bulk", { ids }).then((r) => {
      if (!r.data.success) return;
      const map = Object.fromEntries(r.data.products.map((p) => [p._id, p]));
      cacheProducts(r.data.products);
      setProducts(ids.map((id) => map[id]).filter(Boolean)); // keep most-recent-first order
    }).catch(() => {});
    // eslint-disable-next-line
  }, [excludeId]);

  if (!products.length) return null;
  return (
    <section>
      <SectionHeader title="Recently Viewed" subtitle="Pick up where you left off" />
      <ProductScroller products={products} />
    </section>
  );
};

export default RecentlyViewed;
