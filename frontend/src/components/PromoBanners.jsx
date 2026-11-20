import React, { useContext, useEffect, useState } from "react";
import api from "../api";
import { ShopContext } from "../context/ShopContext";
import BannerLink from "./BannerLink";

// grid class chosen by banner count (full class names so Tailwind can see them)
const COLS = { 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3" };

/** Promo cards in the middle of the home page. Upload "Promo card" banners in Admin → Banners. */
const PromoBanners = () => {
  const { config } = useContext(ShopContext);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    api.get("/banner/list", { params: { position: "strip" } }).then((r) => setBanners(r.data.banners || [])).catch(() => {});
  }, []);

  const fallback = [
    { _id: "p1", title: "Free delivery", subtitle: `On orders above ₹${config.freeDeliveryAbove}`, link: "/collection", bg: "from-fuchsia-500 to-pink-500", emoji: "🚚" },
    { _id: "p2", title: "Cash on Delivery", subtitle: "Pay when your order arrives", link: "/collection", bg: "from-amber-500 to-orange-500", emoji: "💵" },
    { _id: "p3", title: "Easy 10-day returns", subtitle: "Shop with confidence", link: "/policy/returns", bg: "from-emerald-500 to-teal-600", emoji: "↩️" },
  ];
  const list = (banners.length ? banners : fallback).slice(0, 3);

  return (
    <section className={`grid gap-3 sm:gap-4 ${COLS[list.length]}`}>
      {list.map((b) => (
        <BannerLink key={b._id} to={b.link} className="group relative block aspect-2/1 overflow-hidden rounded-xl">
          {b.image ? (
            <>
              <img src={b.image} alt={b.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-linear-to-r from-black/55 to-transparent" />
            </>
          ) : (
            <div className={`h-full w-full bg-linear-to-br ${b.bg}`} />
          )}
          <div className="absolute inset-0 flex items-center justify-between gap-2 p-5 text-white">
            <div>
              <p className="text-lg font-extrabold leading-tight sm:text-2xl">{b.title}</p>
              {b.subtitle && <p className="mt-1 text-xs opacity-90 sm:text-sm">{b.subtitle}</p>}
              <span className="mt-3 inline-block rounded-full bg-white px-4 py-1 text-xs font-bold text-gray-900">Shop now →</span>
            </div>
            {b.emoji && <span className="text-5xl opacity-90 sm:text-6xl">{b.emoji}</span>}
          </div>
        </BannerLink>
      ))}
    </section>
  );
};

export default PromoBanners;