import React, { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";
import { currency } from "../App";

const Card = ({ label, value, sub, color }) => (
  <div className={`rounded-xl border bg-white p-4 shadow-sm`}>
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    <p className={`mt-1 text-2xl font-bold ${color || "text-gray-800"}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400">{sub}</p>}
  </div>
);

const Dashboard = ({ token, setToken }) => {
  const api = useMemo(() => adminApi(token, setToken), [token]);
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");

  const load = () => api.get("/order/admin/stats").then((r) => setS(r.data.stats)).catch((e) => setErr(e.message));
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [api]);

  if (err) return <p className="text-red-600">Could not load dashboard: {err}</p>;
  if (!s) return <p>Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Revenue" value={currency(s.revenue)} sub={`${s.orders} orders`} color="text-fuchsia-700" />
        <Card label="Today" value={currency(s.todayRevenue)} sub={`${s.todayOrders} orders`} />
        <Card label="Customers" value={s.users} />
        <Card label="Products" value={s.products} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-800">🔥 Trending now (live)</h2>
            <span className="text-xs text-gray-400">refreshes every 30s</span>
          </div>
          {s.trending.length === 0 && <p className="text-sm text-gray-400">No activity yet.</p>}
          {s.trending.map((p, i) => (
            <div key={p._id} className="flex items-center gap-3 border-t py-2 first:border-0">
              <b className="w-5 text-orange-500">#{i + 1}</b>
              <img src={p.image[0]} className="h-10 w-10 rounded object-cover" alt="" />
              <p className="line-clamp-1 flex-1 text-sm">{p.name}</p>
              <span className="text-xs text-gray-400">score {p.trendScore}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-800">Orders by status</h2>
          {["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"].map((k) => (
            <div key={k} className="flex justify-between border-t py-2 text-sm first:border-0">
              <span>{k}</span>
              <b>{s.byStatus[k] || 0}</b>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-800">⚠️ Low stock (5 or fewer)</h2>
          {s.lowStock.length === 0 && <p className="text-sm text-gray-400">All products are well stocked.</p>}
          {s.lowStock.map((p) => (
            <div key={p._id} className="flex items-center gap-3 border-t py-2 first:border-0">
              <img src={p.image[0]} className="h-10 w-10 rounded object-cover" alt="" />
              <p className="line-clamp-1 flex-1 text-sm">{p.name}</p>
              <b className={p.stock === 0 ? "text-red-600" : "text-orange-500"}>{p.stock} left</b>
            </div>
          ))}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 font-bold text-gray-800">Top selling</h2>
          {s.topSelling.length === 0 && <p className="text-sm text-gray-400">No sales yet.</p>}
          {s.topSelling.map((p) => (
            <div key={p._id} className="flex items-center gap-3 border-t py-2 first:border-0">
              <img src={p.image[0]} className="h-10 w-10 rounded object-cover" alt="" />
              <p className="line-clamp-1 flex-1 text-sm">{p.name}</p>
              <b>{p.sold} sold</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
