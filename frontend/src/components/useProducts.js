import { useContext, useEffect, useState } from "react";
import api from "../api";
import { ShopContext } from "../context/ShopContext";

/** Fetches a product list endpoint and puts the items in the shared product cache */
const useProducts = (url, params, deps = []) => {
  const { cacheProducts } = useContext(ShopContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    api.get(url, { params })
      .then((r) => {
        if (!live || !r.data.success) return;
        setProducts(r.data.products);
        cacheProducts(r.data.products);
      })
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => { live = false; };
    // eslint-disable-next-line
  }, deps);

  return { products, loading };
};

export default useProducts;
