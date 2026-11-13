import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "../components/ProductItem";

const Wishlist = () => {
  const { wishlist, productCache, ensureProducts } = useContext(ShopContext);
  const ids = [...wishlist];
  useEffect(() => { ensureProducts(ids); }, [wishlist.size]); // eslint-disable-line
  const products = ids.map((id) => productCache[id]).filter(Boolean);

  return (
    <div className="py-4 sm:py-8">
      <h1 className="mb-4 text-xl font-bold sm:text-2xl">My Wishlist <span className="text-base font-normal text-gray-500">({ids.length})</span></h1>
      {ids.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-5xl">💜</p>
          <p className="mt-2 font-semibold">Your wishlist is empty</p>
          <p className="text-sm text-gray-500">Tap the heart on any product to save it here.</p>
          <Link to="/" className="mt-4 inline-block rounded-lg bg-brand px-8 py-3 text-sm font-bold text-white">Explore products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {products.map((p) => <ProductItem key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
