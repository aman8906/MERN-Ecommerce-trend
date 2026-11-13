import React from "react";
import SectionHeader from "./SectionHeader";
import ProductScroller from "./ProductScroller";
import useProducts from "./useProducts";

const RelatedProducts = ({ productId }) => {
  const { products, loading } = useProducts(`/product/related/${productId}`, {}, [productId]);
  if (!loading && !products.length) return null;
  return (
    <section>
      <SectionHeader title="Similar Products" subtitle="You might also like" />
      <ProductScroller products={products} loading={loading} />
    </section>
  );
};

export default RelatedProducts;
