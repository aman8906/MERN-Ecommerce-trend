import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

// shown until you upload banners in Admin → Banners
const FALLBACK = [
  { _id: "f1", title: "Mega Fashion Sale", subtitle: "Up to 70% off on top brands", link: "/collection?sort=discount", bg: "from-fuchsia-600 via-purple-600 to-indigo-600", cta: "Shop the sale" },
  { _id: "f2", title: "Trending Right Now", subtitle: "See what everyone is buying today", link: "/trending", bg: "from-orange-500 via-red-500 to-pink-600", cta: "Explore trending" },
  { _id: "f3", title: "New Arrivals", subtitle: "Fresh styles added every day", link: "/collection?sort=newest", bg: "from-emerald-500 via-teal-500 to-cyan-600", cta: "Discover" },
];

const HeroCarousel = () => {
  const [slides, setSlides] = useState(FALLBACK);
  const [i, setI] = useState(0);

  useEffect(() => {
    api.get("/banner/list").then((r) => r.data.banners?.length && setSlides(r.data.banners)).catch(() => {});
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s) => (
          <Link key={s._id} to={s.link || "/collection"} className="relative block h-44 w-full shrink-0 sm:h-72 lg:h-80">
            {s.image ? (
              <>
                <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
              </>
            ) : (
              <div className={`h-full w-full bg-gradient-to-r ${s.bg}`} />
            )}
            <div className="absolute inset-0 flex flex-col justify-center gap-1 px-6 text-white sm:gap-3 sm:px-14">
              <h2 className="max-w-md text-2xl font-extrabold leading-tight drop-shadow sm:text-5xl">{s.title}</h2>
              {s.subtitle && <p className="max-w-sm text-sm opacity-90 sm:text-lg">{s.subtitle}</p>}
              <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-bold text-gray-900 sm:px-6 sm:py-2 sm:text-sm">
                {s.cta || "Shop now"}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {slides.map((s, idx) => (
          <button key={s._id} aria-label={`Slide ${idx + 1}`} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
