import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { HeartIcon, StarIcon } from "./Icons";
import { money, compact } from "../utils/format";

// grey placeholder shown when a photo URL is missing or broken (instead of the browser's broken-image icon)
const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="#f3f4f6"/><text x="200" y="270" font-size="72" text-anchor="middle">🛍️</text></svg>'
  );

// Cloudinary: ask for a card-sized copy (about 450px wide) instead of the full photo. Much less data on mobile.
export const thumb = (url) => {
  if (!url || !url.includes("res.cloudinary.com") || !url.includes("/upload/")) return url;
  if (url.includes("/upload/f_auto,q_auto,w_900/")) return url.replace("/upload/f_auto,q_auto,w_900/", "/upload/f_auto,q_auto,w_450/");
  return url.replace(/\/upload\/(v\d+\/)/, "/upload/f_auto,q_auto,w_450/$1"); // photos uploaded from admin (no transformation yet)
};

export const RatingPill = ({ rating, count, className = "" }) =>
  rating > 0 ? (
    <span className={`inline-flex items-center gap-0.5 rounded bg-good px-1.5 py-0.5 text-[11px] font-semibold text-white ${className}`}>
      {rating.toFixed(1)} <StarIcon size={10} />
      {count ? <span className="font-normal opacity-80">&nbsp;({compact(count)})</span> : null}
    </span>
  ) : (
    <span className="rounded bg-brand-light px-1.5 py-0.5 text-[10px] font-semibold text-brand">NEW</span>
  );

/**
 * badge: optional overlay on the image (e.g. trending rank)
 */
const ProductItem = ({ product, rank }) => {
  const { wishlist, toggleWishlist, cacheProducts, config } = useContext(ShopContext);
  const liked = wishlist.has(product._id);
  const out = product.stock <= 0;
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [product.image?.[0]]);

  return (
    <div className="relative flex flex-col overflow-hidden rounded-lg border border-gray-100 bg-white transition hover:shadow-lg">
      <Link to={`/product/${product._id}`} onClick={() => cacheProducts([product])} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <img
            src={broken ? FALLBACK : thumb(product.image?.[0]) || FALLBACK}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setBroken(true)}
            className={`h-full w-full object-cover transition duration-500 hover:scale-105 ${out ? "opacity-50" : ""}`}
          />
          {rank && (
            <span className="absolute left-0 top-0 rounded-br-lg bg-gradient-to-br from-orange-500 to-red-500 px-2.5 py-1 text-xs font-bold text-white shadow">
              #{rank}
            </span>
          )}
          {product.discountPercent >= 10 && !rank && (
            <span className="absolute left-0 top-0 rounded-br-lg bg-deal px-2 py-1 text-[11px] font-bold text-white">
              {product.discountPercent}% OFF
            </span>
          )}
          {out && (
            <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs font-medium text-white">Out of stock</span>
          )}
          {!out && product.stock <= 5 && (
            <span className="absolute inset-x-0 bottom-0 bg-orange-500/90 py-1 text-center text-[11px] font-medium text-white">
              Only {product.stock} left
            </span>
          )}
        </div>
        <div className="space-y-1 p-2.5">
          {product.brand && <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-400">{product.brand}</p>}
          <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-tight text-gray-800">{product.name}</p>
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="text-base font-bold text-gray-900">{money(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-xs text-gray-400 line-through">{money(product.mrp)}</span>
                {rank && product.discountPercent >= 10 && <span className="text-xs font-semibold text-good">{product.discountPercent}% off</span>}
              </>
            )}
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <RatingPill rating={product.rating} count={product.ratingCount} />
            {product.price >= config.freeDeliveryAbove && <span className="text-[10px] font-medium text-gray-500">Free Delivery</span>}
          </div>
        </div>
      </Link>
      <button
        aria-label="Wishlist"
        onClick={() => toggleWishlist(product)}
        className={`absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow transition hover:scale-110 ${liked ? "text-deal" : "text-gray-500"}`}
      >
        <HeartIcon size={18} filled={liked} />
      </button>
    </div>
  );
};

export default ProductItem;