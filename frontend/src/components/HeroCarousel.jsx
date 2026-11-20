import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "../api";
import BannerLink from "./BannerLink";
import { ChevronIcon } from "./Icons";

// shown until you upload "Hero slider" banners in Admin → Banners
const FALLBACK = [
  { _id: "f1", title: "Mega Fashion Sale", subtitle: "Up to 70% off on top brands", link: "/collection?sort=discount", bg: "from-fuchsia-600 via-purple-600 to-indigo-600", cta: "Shop the sale" },
  { _id: "f2", title: "Trending Right Now", subtitle: "See what everyone is buying today", link: "/trending", bg: "from-orange-500 via-red-500 to-pink-600", cta: "Explore trending" },
  { _id: "f3", title: "New Arrivals", subtitle: "Fresh styles added every day", link: "/collection?sort=newest", bg: "from-emerald-500 via-teal-500 to-cyan-600", cta: "Discover" },
];

const HeroCarousel = () => {
  const [slides, setSlides] = useState(FALLBACK);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  useEffect(() => {
    api.get("/banner/list", { params: { position: "hero" } })
      .then((r) => { if (r.data.banners?.length) { setSlides(r.data.banners); setI(0); } })
      .catch(() => {});
  }, []);

  const go = useCallback((n) => setI((x) => (x + n + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [slides.length, paused, go]);

  const onTouchEnd = (e) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1); // swipe left = next
  };

  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-gray-100"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={onTouchEnd}
    >
      <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => (
          <BannerLink key={s._id} to={s.link} className="relative block h-44 w-full shrink-0 sm:h-72 lg:h-96">
            {s.image ? (
              <>
                <img
                  src={s.image}
                  alt={s.title}
                  loading={idx === 0 ? "eager" : "lazy"}
                  decoding="async"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-r from-black/60 via-black/20 to-transparent" />
              </>
            ) : (
              <div className={`h-full w-full bg-linear-to-r ${s.bg}`} />
            )}
            <div className="absolute inset-0 flex flex-col justify-center gap-1 px-6 text-white sm:gap-3 sm:px-14">
              <h2 className="max-w-md text-2xl font-extrabold leading-tight drop-shadow-sm sm:text-5xl">{s.title}</h2>
              {s.subtitle && <p className="max-w-sm text-sm opacity-90 sm:text-lg">{s.subtitle}</p>}
              <span className="mt-1 w-fit rounded-full bg-white px-4 py-1.5 text-xs font-bold text-gray-900 sm:px-6 sm:py-2 sm:text-sm">
                {s.cta || "Shop now"} →
              </span>
            </div>
          </BannerLink>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button aria-label="Previous banner" onClick={() => go(-1)} className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:bg-white group-hover:flex">
            <ChevronIcon dir="left" size={20} />
          </button>
          <button aria-label="Next banner" onClick={() => go(1)} className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-800 shadow-sm transition hover:bg-white group-hover:flex">
            <ChevronIcon size={20} />
          </button>
          <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((s, idx) => (
              <button key={s._id} aria-label={`Go to banner ${idx + 1}`} onClick={() => setI(idx)} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HeroCarousel;