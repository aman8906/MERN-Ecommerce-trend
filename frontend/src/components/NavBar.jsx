import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import api from "../api";
import { SearchIcon, HeartIcon, CartIcon, UserIcon, FireIcon } from "./Icons";
import { money } from "../utils/format";

const SearchBox = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const location = useLocation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const box = useRef(null);

  useEffect(() => { setQ(location.pathname === "/collection" ? params.get("search") || "" : ""); }, [location.pathname, params]);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const t = setTimeout(() => {
      api.get("/product/suggest", { params: { q } }).then((r) => setItems(r.data.suggestions || [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    setOpen(false);
    navigate(q.trim() ? `/collection?search=${encodeURIComponent(q.trim())}` : "/collection");
  };

  return (
    <form onSubmit={submit} ref={box} className="relative w-full">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-brand focus-within:bg-white">
        <SearchIcon size={18} className="text-gray-400" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search for products, brands and more"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>
      {open && items.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border bg-white shadow-xl">
          {items.map((s) => (
            <Link key={s._id} to={`/product/${s._id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-brand-soft">
              <img src={s.image[0]} alt="" className="h-10 w-10 rounded object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-gray-800">{s.name}</p>
                <p className="text-xs text-gray-400">in {s.category}</p>
              </div>
              <span className="text-sm font-semibold">{money(s.price)}</span>
            </Link>
          ))}
          <button type="submit" className="w-full border-t px-3 py-2 text-left text-sm font-medium text-brand hover:bg-brand-soft">
            See all results for "{q}"
          </button>
        </div>
      )}
    </form>
  );
};

const NavBar = () => {
  const { getCartCount, wishlist, token, userName, logout, categories, config } = useContext(ShopContext);
  const [params] = useSearchParams();
  const location = useLocation();
  const activeCat = location.pathname === "/collection" ? params.get("category") : null;
  const count = getCartCount();

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="bg-brand py-1.5 text-center text-[11px] font-medium text-white sm:text-xs">
        Free delivery on orders above ₹{config.freeDeliveryAbove} &nbsp;•&nbsp; Cash on Delivery available &nbsp;•&nbsp; Easy 10-day returns
      </div>

      <div className="mx-auto max-w-[1360px] px-3 sm:px-6">
        <div className="flex items-center gap-3 py-2.5 sm:gap-6">
          <Link to="/" className="shrink-0">
            <img src={assets.logo} className="w-28 sm:w-36" alt="Trendify" />
          </Link>
          <div className="mx-auto hidden max-w-2xl flex-1 sm:block"><SearchBox /></div>

          <div className="ml-auto flex items-center gap-4 sm:gap-6">
            <div className="group relative hidden sm:block">
              <Link to={token ? "/orders" : "/login"} className="flex flex-col items-center text-gray-700 hover:text-brand">
                <UserIcon size={22} />
                <span className="text-[11px] font-medium">{token ? userName.split(" ")[0] || "Account" : "Login"}</span>
              </Link>
              {token && (
                <div className="absolute right-0 hidden pt-3 group-hover:block">
                  <div className="w-40 overflow-hidden rounded-lg border bg-white py-1 text-sm shadow-xl">
                    <Link to="/orders" className="block px-4 py-2 hover:bg-brand-soft">My Orders</Link>
                    <Link to="/wishlist" className="block px-4 py-2 hover:bg-brand-soft">Wishlist</Link>
                    <button onClick={logout} className="block w-full px-4 py-2 text-left text-deal hover:bg-brand-soft">Logout</button>
                  </div>
                </div>
              )}
            </div>
            <Link to="/wishlist" className="relative hidden flex-col items-center text-gray-700 hover:text-brand sm:flex">
              <HeartIcon size={22} />
              <span className="text-[11px] font-medium">Wishlist</span>
              {wishlist.size > 0 && <b className="absolute -right-2 -top-1 rounded-full bg-deal px-1.5 text-[10px] leading-4 text-white">{wishlist.size}</b>}
            </Link>
            <Link to="/cart" className="relative flex flex-col items-center text-gray-700 hover:text-brand">
              <CartIcon size={22} />
              <span className="hidden text-[11px] font-medium sm:block">Cart</span>
              {count > 0 && <b className="absolute -right-2 -top-1 rounded-full bg-brand px-1.5 text-[10px] leading-4 text-white">{count}</b>}
            </Link>
            {!token && <Link to="/login" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white sm:hidden">Login</Link>}
          </div>
        </div>
        <div className="pb-2.5 sm:hidden"><SearchBox /></div>
      </div>

      {/* Category strip */}
      <nav className="border-t border-gray-100">
        <div className="no-scrollbar mx-auto flex max-w-[1360px] gap-1 overflow-x-auto px-3 py-1.5 sm:gap-2 sm:px-6">
          <NavLink to="/trending" className={({ isActive }) => `flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold sm:text-sm ${isActive ? "bg-orange-100 text-orange-600" : "text-orange-600 hover:bg-orange-50"}`}>
            <FireIcon size={16} /> Trending
          </NavLink>
          <Link to="/collection" className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${location.pathname === "/collection" && !activeCat ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-100"}`}>
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c._id}
              to={`/collection?category=${encodeURIComponent(c.name)}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm ${activeCat === c.name ? "bg-brand text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <span>{c.icon}</span>{c.name}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
