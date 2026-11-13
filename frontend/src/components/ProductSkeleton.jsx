import React from "react";

const ProductSkeleton = ({ count = 5 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="overflow-hidden rounded-lg border border-gray-100 bg-white">
        <div className="skeleton aspect-[4/5]" />
        <div className="space-y-2 p-3">
          <div className="skeleton h-3 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
    ))}
  </>
);

export default ProductSkeleton;
