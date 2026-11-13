import React, { useContext, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import api from "../api";
import RelatedProducts from "../components/RelatedProducts";
import RecentlyViewed from "../components/RecentlyViewed";
import { RatingPill } from "../components/ProductItem";
import { HeartIcon, TruckIcon, ShieldIcon, ReturnIcon, StarIcon } from "../components/Icons";
import { money, deliveryDate } from "../utils/format";

const Reviews = ({ productId, onChange }) => {
  const { token } = useContext(ShopContext);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = () => api.get(`/review/${productId}`).then((r) => setReviews(r.data.reviews || [])).catch(() => {});
  useEffect(() => { load(); }, [productId]); // eslint-disable-line

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/review", { productId, rating, comment });
      if (data.success) { toast.success(data.message); setComment(""); load(); onChange?.(); }
      else toast.error(data.message);
    } catch (err) { toast.error(err.response?.data?.message || "Could not submit review"); }
  };

  return (
    <div className="space-y-4">
      {token ? (
        <form onSubmit={submit} className="rounded-lg border bg-white p-4">
          <p className="mb-2 text-sm font-semibold">Rate this product</p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} className={n <= rating ? "text-amber-400" : "text-gray-300"}><StarIcon size={26} /></button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} placeholder="Share your experience (optional)" className="w-full rounded border p-2 text-sm outline-none focus:border-brand" rows={2} />
          <button className="mt-2 rounded bg-brand px-5 py-2 text-sm font-semibold text-white">Submit review</button>
        </form>
      ) : (
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500"><Link to="/login" className="font-semibold text-brand">Login</Link> to write a review.</p>
      )}
      {reviews.length === 0 && <p className="text-sm text-gray-400">No reviews yet. Be the first!</p>}
      {reviews.map((r) => (
        <div key={r._id} className="border-b pb-3">
          <div className="flex items-center gap-2">
            <RatingPill rating={r.rating} />
            <span className="text-sm font-medium">{r.userName}</span>
            {r.verified && <span className="text-[11px] font-medium text-good">✓ Verified purchase</span>}
          </div>
          {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
          <p className="mt-1 text-[11px] text-gray-400">{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      ))}
    </div>
  );
};

const Product = () => {
  const { productId } = useParams();
  const { addToCart, wishlist, toggleWishlist, track, pushRecent, navigate, cacheProducts, config } = useContext(ShopContext);
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [tab, setTab] = useState("description");

  const load = () =>
    api.post("/product/single", { productId })
      .then((r) => {
        if (r.data.success) { setProduct(r.data.product); setImage((i) => i || r.data.product.image[0]); cacheProducts([r.data.product]); }
      })
      .catch(() => setNotFound(true));

  useEffect(() => {
    setProduct(null); setNotFound(false); setImage(""); setSize(""); setTab("description");
    window.scrollTo({ top: 0 });
    load();
    track("view", productId);
    pushRecent(productId);
    // eslint-disable-next-line
  }, [productId]);

  if (notFound) return <div className="py-32 text-center"><p className="text-xl font-semibold">Product not found</p><Link to="/" className="mt-3 inline-block text-brand">Back to home</Link></div>;
  if (!product) return <div className="grid gap-8 py-8 sm:grid-cols-2"><div className="skeleton aspect-[4/5] rounded-lg" /><div className="space-y-3"><div className="skeleton h-8 w-3/4 rounded" /><div className="skeleton h-6 w-1/3 rounded" /><div className="skeleton h-24 rounded" /></div></div>;

  const out = product.stock <= 0;
  const liked = wishlist.has(product._id);
  const needsSize = product.sizes?.length > 0;

  return (
    <div className="space-y-10 py-4 sm:py-8">
      <div className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        {/* Gallery */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <div className="no-scrollbar flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-y-auto">
            {product.image.map((img) => (
              <img key={img} src={img} onClick={() => setImage(img)} alt="" className={`h-16 w-16 shrink-0 cursor-pointer rounded border-2 object-cover sm:h-20 sm:w-20 ${image === img ? "border-brand" : "border-transparent"}`} />
            ))}
          </div>
          <div className="relative flex-1 overflow-hidden rounded-lg bg-gray-100">
            <img src={image} alt={product.name} className="aspect-[4/5] w-full object-cover" />
            <button onClick={() => toggleWishlist(product)} aria-label="Wishlist" className={`absolute right-3 top-3 rounded-full bg-white p-2 shadow ${liked ? "text-deal" : "text-gray-500"}`}>
              <HeartIcon size={22} filled={liked} />
            </button>
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{product.brand || product.category}</p>
          <h1 className="mt-1 text-xl font-semibold text-gray-900 sm:text-2xl">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2"><RatingPill rating={product.rating} count={product.ratingCount} /></div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{money(product.price)}</span>
            {product.mrp > product.price && <span className="text-lg text-gray-400 line-through">{money(product.mrp)}</span>}
            {product.discountPercent > 0 && <span className="text-lg font-bold text-good">{product.discountPercent}% off</span>}
          </div>
          <p className="text-xs text-gray-400">Inclusive of all taxes</p>

          {out ? <p className="mt-3 font-semibold text-deal">Out of stock</p>
            : product.stock <= 5 ? <p className="mt-3 text-sm font-semibold text-orange-600">Hurry! Only {product.stock} left</p> : null}

          {needsSize && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Select size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`min-w-12 rounded-full border px-4 py-2 text-sm font-medium ${s === size ? "border-brand bg-brand-light text-brand" : "border-gray-300 hover:border-brand"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button disabled={out} onClick={() => addToCart(product, size)} className="flex-1 rounded-lg border-2 border-brand py-3 text-sm font-bold text-brand hover:bg-brand-light disabled:cursor-not-allowed disabled:opacity-40">ADD TO CART</button>
            <button disabled={out} onClick={() => addToCart(product, size) && navigate("/cart")} className="flex-1 rounded-lg bg-brand py-3 text-sm font-bold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">BUY NOW</button>
          </div>

          <div className="mt-6 space-y-3 rounded-lg border bg-white p-4 text-sm">
            <p className="flex items-center gap-2"><TruckIcon size={20} className="text-brand" /> Delivery by <b>{deliveryDate()}</b> {product.price >= config.freeDeliveryAbove ? <span className="font-semibold text-good">· Free</span> : <span className="text-gray-400">· Free above ₹{config.freeDeliveryAbove}</span>}</p>
            <p className="flex items-center gap-2"><ShieldIcon size={20} className="text-brand" /> 100% authentic · Cash on Delivery available</p>
            <p className="flex items-center gap-2"><ReturnIcon size={20} className="text-brand" /> 10-day easy returns & exchange</p>
          </div>
        </div>
      </div>

      <div>
        <div className="flex border-b">
          {[["description", "Description"], ["reviews", `Reviews (${product.ratingCount})`]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-5 py-3 text-sm font-semibold ${tab === k ? "border-b-2 border-brand text-brand" : "text-gray-500"}`}>{l}</button>
          ))}
        </div>
        <div className="py-4">
          {tab === "description" ? (
            <div className="space-y-2 text-sm leading-relaxed text-gray-600">
              <p>{product.description}</p>
              {product.tags?.length > 0 && <p className="pt-2">{product.tags.map((t) => <Link key={t} to={`/collection?search=${t}`} className="mr-2 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs hover:bg-brand-light">#{t}</Link>)}</p>}
            </div>
          ) : (
            <Reviews productId={product._id} onChange={load} />
          )}
        </div>
      </div>

      <RelatedProducts productId={product._id} />
      <RecentlyViewed excludeId={product._id} />
    </div>
  );
};

export default Product;
