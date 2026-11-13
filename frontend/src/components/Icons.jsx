import React from "react";

const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
const Svg = ({ size = 22, children, className = "", fill }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} {...base} fill={fill || "none"}>
    {children}
  </svg>
);

export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>;
export const HeartIcon = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3 5 6.5 5c2 0 3.4 1.1 4.2 2.4h.6C12.1 6.1 13.5 5 15.5 5 19 5 20.800 8.600 19.500 11.800 17.500 16.400 12 21 12 21Z" />
  </Svg>
);
export const CartIcon = (p) => <Svg {...p}><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2 3h3l2.6 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6" /></Svg>;
export const UserIcon = (p) => <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></Svg>;
export const HomeIcon = (p) => <Svg {...p}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /></Svg>;
export const GridIcon = (p) => <Svg {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>;
export const CloseIcon = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const FilterIcon = (p) => <Svg {...p}><path d="M3 5h18M6 12h12M10 19h4" /></Svg>;
export const ChevronIcon = ({ dir = "right", ...p }) => (
  <Svg {...p} className={`${p.className || ""} ${{ right: "", left: "rotate-180", down: "rotate-90", up: "-rotate-90" }[dir]}`}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
export const StarIcon = (p) => <svg width={p.size || 12} height={p.size || 12} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 6.9 7.500.7-5.700 5 1.700 7.400L12 18l-6.500 4 1.700-7.400-5.700-5L9 8.900z" /></svg>;
export const TruckIcon = (p) => <Svg {...p}><path d="M2 6h11v10H2zM13 9h4l4 3v4h-8" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Svg>;
export const ShieldIcon = (p) => <Svg {...p}><path d="M12 3 4 6v6c0 4.500 3.400 8 8 9 4.600-1 8-4.500 8-9V6z" /><path d="m9 12 2 2 4-4" /></Svg>;
export const ReturnIcon = (p) => <Svg {...p}><path d="M3 7h12a5 5 0 0 1 0 10H8" /><path d="m7 3-4 4 4 4" /></Svg>;
export const FireIcon = (p) => (
  <svg width={p.size || 20} height={p.size || 20} viewBox="0 0 24 24" className={p.className}>
    <path d="M12 2c.6 3-1 4.600-2.500 6.200C8 9.800 7 11.200 7 13.500a5 5 0 0 0 10 0c0-1.600-.7-2.900-1.500-3.900-.2 1.200-.8 2-1.700 2.400.6-3.700-.3-7.600-1.800-10Z" fill="#ff6a00" />
    <path d="M12 22a3.500 3.500 0 0 1-3.500-3.500c0-1.800 1.300-2.600 2-3.800.3 1 1 1.500 1.700 1.800.5-.7.600-1.500.5-2.300 1.500.9 2.800 2.300 2.800 4.300A3.500 3.500 0 0 1 12 22Z" fill="#ffc107" />
  </svg>
);
