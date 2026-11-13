import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { HomeIcon, GridIcon, FireIcon, HeartIcon, CartIcon, UserIcon } from "./Icons";

const Item = ({ to, icon, label, badge, end }) => (
  <NavLink to={to} end={end} className={({ isActive }) => `relative flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium ${isActive ? "text-brand" : "text-gray-500"}`}>
    {icon}
    {label}
    {badge > 0 && <b className="absolute right-[22%] top-0.5 rounded-full bg-brand px-1 text-[9px] leading-4 text-white">{badge}</b>}
  </NavLink>
);

/** Meesho-style bottom tab bar, mobile only */
const BottomNav = () => {
  const { getCartCount, token } = useContext(ShopContext);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,.06)] sm:hidden">
      <Item to="/" end icon={<HomeIcon size={21} />} label="Home" />
      <Item to="/collection" icon={<GridIcon size={21} />} label="Shop" />
      <Item to="/trending" icon={<FireIcon size={21} />} label="Trending" />
      <Item to="/wishlist" icon={<HeartIcon size={21} />} label="Wishlist" />
      <Item to="/cart" icon={<CartIcon size={21} />} label="Cart" badge={getCartCount()} />
      <Item to={token ? "/orders" : "/login"} icon={<UserIcon size={21} />} label={token ? "Orders" : "Login"} />
    </nav>
  );
};

export default BottomNav;
