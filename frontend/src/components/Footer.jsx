import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { SITE } from "../config/site";
import { TruckIcon, ShieldIcon, ReturnIcon } from "./Icons";

const Social = ({ href, label, children }) =>
  href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand">
      {children}
    </a>
  ) : null;

const svg = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

const Col = ({ title, children }) => (
  <div>
    <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{title}</p>
    <ul className="space-y-2.5 text-sm">{children}</ul>
  </div>
);
const L = ({ to, children }) => (
  <li><Link to={to} className="text-gray-400 transition hover:text-white">{children}</Link></li>
);

const PAYMENTS = ["UPI", "Visa", "Mastercard", "RuPay", "Net Banking", "Cash on Delivery"];

const Footer = () => {
  const { categories, config } = useContext(ShopContext);

  return (
    <footer className="mt-12 bg-gray-900 text-gray-300">
      {/* trust strip */}
      <div className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
          {[
            [<TruckIcon size={24} />, "Free delivery", `On orders above ₹${config.freeDeliveryAbove}`],
            [<ReturnIcon size={24} />, "Easy returns", "10-day return & exchange"],
            [<ShieldIcon size={24} />, "Secure payments", "UPI, cards & netbanking"],
            [<span className="text-2xl leading-none">💵</span>, "Cash on Delivery", "Pay when it arrives"],
          ].map(([icon, t, s]) => (
            <div key={t} className="flex items-center gap-3">
              <span className="text-brand-light">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{t}</p>
                <p className="text-xs text-gray-400">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* main links */}
      <div className="mx-auto grid max-w-[1360px] gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr_1.3fr]">
        <div>
          <Link to="/"><img src={assets.logo} alt={SITE.name} className="mb-4 w-36 rounded bg-white px-2 py-1" /></Link>
          <p className="max-w-xs text-sm leading-relaxed text-gray-400">
            {SITE.name}: fashion, electronics, home, beauty and more at honest prices, delivered across India. {SITE.tagline}.
          </p>
          <div className="mt-5 flex gap-2">
            <Social href={SITE.social.instagram} label="Instagram">
              <svg {...svg}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></svg>
            </Social>
            <Social href={SITE.social.facebook} label="Facebook">
              <svg {...svg}><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v6h4v-6h3l1-4h-4V8z" /></svg>
            </Social>
            <Social href={SITE.social.youtube} label="YouTube">
              <svg {...svg}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" /></svg>
            </Social>
          </div>
        </div>

        <Col title="Shop">
          <L to="/trending">🔥 Trending now</L>
          <L to="/collection?sort=discount&minDiscount=40">Deals & offers</L>
          <L to="/collection?sort=newest">New arrivals</L>
          {categories.slice(0, 5).map((c) => (
            <L key={c._id} to={`/collection?category=${encodeURIComponent(c.name)}`}>{c.name}</L>
          ))}
        </Col>

        <Col title="Help">
          <L to="/orders">My orders</L>
          <L to="/wishlist">Wishlist</L>
          <L to="/policy/shipping">Shipping & delivery</L>
          <L to="/policy/returns">Returns & refunds</L>
          <L to="/contact">Contact us</L>
        </Col>

        <Col title="Company">
          <L to="/about">About us</L>
          <L to="/policy/privacy">Privacy policy</L>
          <L to="/policy/terms">Terms & conditions</L>
        </Col>

        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Contact</p>
          <ul className="space-y-2.5 text-sm text-gray-400">
            <li>📍 {SITE.address}</li>
            <li><a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-white">📞 {SITE.phone}</a></li>
            <li><a href={`mailto:${SITE.email}`} className="break-all hover:text-white">✉️ {SITE.email}</a></li>
            <li>🕒 {SITE.hours}</li>
          </ul>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center justify-between gap-4 px-4 py-5 sm:px-6 md:flex-row">
          <p className="text-center text-xs text-gray-500">© {new Date().getFullYear()} {SITE.name}. All rights reserved. · {SITE.domain}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {PAYMENTS.map((p) => (
              <span key={p} className="rounded-sm border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-gray-400">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;