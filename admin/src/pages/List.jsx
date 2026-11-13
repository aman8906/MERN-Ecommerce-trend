import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminApi, errMsg } from "../api";
import { currency } from "../App";

const Row = ({ p, api, onChanged }) => {
  const [v, setV] = useState({ price: p.price, mrp: p.mrp, stock: p.stock });
  const dirty = Number(v.price) !== p.price || Number(v.mrp) !== p.mrp || Number(v.stock) !== p.stock;

  const patch = async (body, msg = "Saved") => {
    try {
      const { data } = await api.post("/product/update", { id: p._id, ...body });
      data.success ? (toast.success(msg), onChanged()) : toast.error(data.message);
    } catch (e) { toast.error(errMsg(e)); }
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try { const { data } = await api.post("/product/remove", { id: p._id }); data.success && (toast.info(data.message), onChanged()); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const num = "w-20 px-2 py-1 text-sm";
  return (
    <tr className="border-t align-middle text-sm">
      <td className="p-2"><img src={p.image[0]} className="h-14 w-12 rounded object-cover" alt="" /></td>
      <td className="max-w-[260px] p-2">
        <p className="line-clamp-2 font-medium text-gray-800">{p.name}</p>
        <p className="text-xs text-gray-400">{p.category}{p.subCategory ? ` › ${p.subCategory}` : ""} · {p.views} views · {p.sold} sold</p>
      </td>
      <td className="p-2"><input type="number" className={num} value={v.price} onChange={(e) => setV({ ...v, price: e.target.value })} /></td>
      <td className="p-2"><input type="number" className={num} value={v.mrp} onChange={(e) => setV({ ...v, mrp: e.target.value })} /><p className="text-[11px] text-green-600">{p.discountPercent}% off</p></td>
      <td className="p-2"><input type="number" className={`${num} ${p.stock <= 5 ? "!border-red-400" : ""}`} value={v.stock} onChange={(e) => setV({ ...v, stock: e.target.value })} /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={!!p.trendingPin} onChange={() => patch({ trendingPin: !p.trendingPin }, "Updated")} title="Boost in trending" /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={!!p.bestSeller} onChange={() => patch({ bestSeller: !p.bestSeller }, "Updated")} /></td>
      <td className="p-2 text-center"><input type="checkbox" checked={p.isActive !== false} onChange={() => patch({ isActive: !(p.isActive !== false) }, p.isActive !== false ? "Hidden from store" : "Visible in store")} /></td>
      <td className="whitespace-nowrap p-2 text-right">
        {dirty && <button onClick={() => patch(v)} className="mr-2 rounded bg-fuchsia-700 px-3 py-1 text-xs font-semibold text-white">Save</button>}
        <button onClick={remove} className="rounded bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">Delete</button>
      </td>
    </tr>
  );
};

const List = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get("/product/list", { params: { page, limit: 25, search, sort: "newest" } })
      .then((r) => { setRows(r.data.products); setPages(r.data.pages); })
      .catch((e) => toast.error(errMsg(e)))
      .finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [page, search]); // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <input placeholder="Search products…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} className="w-64 px-3 py-2" />
      </div>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="p-2" /><th className="p-2">Product</th><th className="p-2">Price</th><th className="p-2">MRP</th><th className="p-2">Stock</th>
              <th className="p-2 text-center">🔥 Boost</th><th className="p-2 text-center">Best seller</th><th className="p-2 text-center">Visible</th><th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => <Row key={p._id + p.price + p.stock + p.mrp} p={p} api={api} onChanged={load} />)}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="p-8 text-center text-gray-400">No products found.</p>}
      </div>
      <div className="flex items-center justify-center gap-3 text-sm">
        <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Prev</button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="rounded border bg-white px-3 py-1 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
};

export default List;
