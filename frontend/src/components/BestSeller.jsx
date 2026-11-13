import React from "react";
import SectionHeader from "./SectionHeader";
import ProductScroller from "./ProductScroller";
import useProducts from "./useProducts";

const BestSeller = () => {
  const { products, loading } = useProducts("/product/list", { bestSeller: "true", sort: "popular", limit: 12 }, []);
  if (!loading && !products.length) return null;
  return (
    <section>
      <SectionHeader title="Best Sellers" subtitle="Top-rated picks loved by our customers" to="/collection?sort=popular" />
      <ProductScroller products={products} loading={loading} />
    </section>
  );
};

export default BestSeller;
