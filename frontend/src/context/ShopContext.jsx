import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../api";

export const ShopContext = createContext();

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

// cart shape: { [productId]: { [size]: qty } }
const mergeCarts = (a, b) => {
  const out = structuredClone(a);
  for (const [id, sizes] of Object.entries(b || {}))
    for (const [size, qty] of Object.entries(sizes)) {
      out[id] = out[id] || {};
      out[id][size] = Math.max(out[id][size] || 0, qty);
    }
  return out;
};

const ShopContextProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setTokenState] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [cartItems, setCartItems] = useState(() => read("cartItems", {}));
  const [wishlist, setWishlist] = useState(() => new Set(read("wishlist", [])));
  const [categories, setCategories] = useState([]);
  const [productCache, setProductCache] = useState({}); // id -> product (cart / wishlist need details)
  const [config, setConfig] = useState({ deliveryFee: 40, freeDeliveryAbove: 499 });
  const cartReady = useRef(!token); // don't push local cart to server before server cart is merged

  const currency = "₹";

  // ---------- bootstrap ----------
  useEffect(() => {
    api.get("/category/list").then((r) => r.data.success && setCategories(r.data.categories)).catch(() => {});
    api.get("/config").then((r) => r.data.success && setConfig(r.data)).catch(() => {});
  }, []);

  // ---------- products cache ----------
  const cacheProducts = useCallback((list) => {
    if (!list?.length) return;
    setProductCache((prev) => {
      const next = { ...prev };
      list.forEach((p) => (next[p._id] = p));
      return next;
    });
  }, []);

  const ensureProducts = useCallback(async (ids) => {
    const missing = ids.filter((id) => !productCache[id]);
    if (!missing.length) return;
    try {
      const { data } = await api.post("/product/bulk", { ids: missing });
      if (data.success) cacheProducts(data.products);
    } catch {}
  }, [productCache, cacheProducts]);

  // ---------- auth ----------
  const setToken = (t, name = "") => {
    if (t) {
      localStorage.setItem("token", t);
      localStorage.setItem("userName", name);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
    }
    setTokenState(t);
    setUserName(name);
  };

  const logout = () => {
    setToken("");
    setCartItems({});
    setWishlist(new Set());
    localStorage.removeItem("cartItems");
    localStorage.removeItem("wishlist");
    cartReady.current = true;
    navigate("/login");
  };

  // when a user logs in (or the page loads with a token): merge guest + server cart & wishlist
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const [cart, wish] = await Promise.all([api.get("/cart"), api.get("/wishlist")]);
        if (cancelled) return;
        if (cart.data.success) setCartItems((local) => mergeCarts(local, cart.data.cartData));
        if (wish.data.success) {
          const local = read("wishlist", []);
          const union = new Set([...wish.data.ids, ...local]);
          setWishlist(union);
          cacheProducts(wish.data.products);
          if (local.some((id) => !wish.data.ids.includes(id))) api.post("/wishlist/sync", { ids: local }).catch(() => {});
        }
      } catch (e) {
        if (e.response?.status === 401) setToken(""); // expired token
      } finally {
        cartReady.current = true;
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, [token]);

  // ---------- cart persistence (localStorage always, server when logged in) ----------
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
    if (!token || !cartReady.current) return;
    const t = setTimeout(() => api.put("/cart", { cartData: cartItems }).catch(() => {}), 700);
    return () => clearTimeout(t);
  }, [cartItems, token]);

  useEffect(() => { localStorage.setItem("wishlist", JSON.stringify([...wishlist])); }, [wishlist]);

  // keep product details for everything in the cart
  useEffect(() => { ensureProducts(Object.keys(cartItems)); }, [cartItems]); // eslint-disable-line

  // ---------- behaviour tracking (feeds Kafka -> Redis trending) ----------
  const track = useCallback((type, productId) => {
    api.post("/product/track", { type, productId }).catch(() => {});
  }, []);

  // ---------- cart actions ----------
  const addToCart = (product, size) => {
    const needsSize = product.sizes?.length > 0;
    const finalSize = needsSize ? size : "One Size";
    if (!finalSize) { toast.error("Please select a size"); return false; }
    if (product.stock <= 0) { toast.error("This item is out of stock"); return false; }

    const inCart = Object.values(cartItems[product._id] || {}).reduce((a, b) => a + b, 0);
    if (inCart >= Math.min(10, product.stock)) { toast.info("You've reached the maximum quantity for this item"); return false; }

    cacheProducts([product]);
    setCartItems((prev) => {
      const next = structuredClone(prev);
      next[product._id] = next[product._id] || {};
      next[product._id][finalSize] = (next[product._id][finalSize] || 0) + 1;
      return next;
    });
    track("add_to_cart", product._id);
    toast.success("Added to cart");
    return true;
  };

  const updateQuantity = (id, size, quantity) => {
    setCartItems((prev) => {
      const next = structuredClone(prev);
      if (!next[id]) return prev;
      if (quantity <= 0) {
        delete next[id][size];
        if (!Object.keys(next[id]).length) delete next[id];
      } else next[id][size] = Math.min(10, quantity);
      return next;
    });
    if (quantity <= 0) toast.info("Removed from cart");
  };

  const clearCart = () => setCartItems({});

  const getCartCount = () =>
    Object.values(cartItems).reduce((t, sizes) => t + Object.values(sizes).reduce((a, b) => a + b, 0), 0);

  const sumCart = (priceOf) => {
    let total = 0;
    for (const [id, sizes] of Object.entries(cartItems)) {
      const p = productCache[id];
      if (!p) continue;
      for (const qty of Object.values(sizes)) total += priceOf(p) * qty;
    }
    return total;
  };
  const getCartAmount = () => sumCart((p) => p.price);
  const getCartMrp = () => sumCart((p) => p.mrp || p.price);
  const getDeliveryFee = () => {
    const sub = getCartAmount();
    return sub === 0 || sub >= config.freeDeliveryAbove ? 0 : config.deliveryFee;
  };

  // ---------- wishlist ----------
  const toggleWishlist = (product) => {
    const id = product._id;
    const adding = !wishlist.has(id);
    setWishlist((prev) => {
      const next = new Set(prev);
      adding ? next.add(id) : next.delete(id);
      return next;
    });
    cacheProducts([product]);
    adding ? toast.success("Saved to wishlist", { autoClose: 1200 }) : toast.info("Removed from wishlist", { autoClose: 1200 });
    if (token) api.post("/wishlist/toggle", { productId: id }).catch(() => {});
    else if (adding) track("wishlist", id);
  };

  // ---------- recently viewed ----------
  const pushRecent = (id) => {
    const list = [id, ...read("recent", []).filter((x) => x !== id)].slice(0, 12);
    localStorage.setItem("recent", JSON.stringify(list));
  };
  const getRecent = () => read("recent", []);

  const value = {
    currency, config, categories, token, setToken, userName, logout, navigate,
    cartItems, addToCart, updateQuantity, clearCart, getCartCount, getCartAmount, getCartMrp, getDeliveryFee,
    productCache, cacheProducts, ensureProducts,
    wishlist, toggleWishlist, track, pushRecent, getRecent,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};

export default ShopContextProvider;
