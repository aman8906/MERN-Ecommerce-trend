import React, { useRef } from "react";
import ProductItem from "./ProductItem";
import ProductSkeleton from "./ProductSkeleton";
import { ChevronIcon } from "./Icons";

/** Horizontal scroll row on mobile, arrows on desktop */
const ProductScroller = ({ products, loading, showRank = false }) => {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="group relative">
      <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto pb-2">
        {loading ? (
          <div className="flex gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-52"><ProductSkeleton count={1} /></div>
            ))}
          </div>
        ) : (
          products.map((p, i) => (
            <div key={p._id} className="w-40 shrink-0 snap-start sm:w-52">
              <ProductItem product={p} rank={showRank ? i + 1 : undefined} />
            </div>
          ))
        )}
      </div>
      {!loading && products.length > 4 && (
        <>
          <button onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-3 top-1/3 hidden h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-brand hover:text-white group-hover:flex">
            <ChevronIcon dir="left" size={18} />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next" className="absolute -right-3 top-1/3 hidden h-9 w-9 items-center justify-center rounded-full bg-white shadow-lg hover:bg-brand hover:text-white group-hover:flex">
            <ChevronIcon size={18} />
          </button>
        </>
      )}
    </div>
  );
};

export default ProductScroller;
