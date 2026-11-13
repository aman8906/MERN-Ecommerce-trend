import React from "react";
import SectionHeader from "./SectionHeader";
import ProductItem from "./ProductItem";
import ProductSkeleton from "./ProductSkeleton";
import useProducts from "./useProducts";

const LatestCollection = () => {
  const { products, loading } = useProducts("/product/list", { sort: "newest", limit: 10 }, []);
  return (
    <section>
      <SectionHeader title="New Arrivals" subtitle="Fresh picks, just landed" to="/collection?sort=newest" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {loading ? <ProductSkeleton count={10} /> : products.map((p) => <ProductItem key={p._id} product={p} />)}
      </div>
    </section>
  );
};

export default LatestCollection;
