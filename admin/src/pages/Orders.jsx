import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminApi, errMsg } from "../api";
import { currency } from "../App";

const STATUSES = ["Order Placed", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"];
const TINT = { "Order Placed": "bg-blue-100 text-blue-700", Packed: "bg-amber-100 text-amber-700", Shipped: "bg-purple-100 text-purple-700", "Out for Delivery": "bg-orange-100 text-orange-700", Delivered: "bg-green-100 text-green-700", Cancelled: "bg-red-100 text-red-700" };

const Orders = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");

  const load = () => api.get("/order/admin/list").then((r) => setOrders(r.data.orders || [])).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [api]); // eslint-disable-line

  const setStatus = async (orderId, status) => {
    try { const { data } = await api.post("/order/admin/status", { orderId, status }); data.success && (toast.success(data.message), load()); }
    catch (e) { toast.error(errMsg(e)); }
  };

  const shown = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Orders <span className="text-base font-normal text-gray-400">({shown.length})</span></h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o._id} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <b className="text-gray-800">#{o._id.slice(-8).toUpperCase()}</b>
                <span className="ml-2 text-gray-400">{new Date(o.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
              </div>
              <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${TINT[o.status]}`}>{o.status}</span>
            </div>
            <div className="mt-3 grid gap-4 md:grid-cols-[1.4fr_1fr_auto]">
              <div className="space-y-1.5">
                {o.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <img src={it.image} className="h-10 w-8 rounded object-cover" alt="" />
                    <span className="line-clamp-1 flex-1">{it.name}</span>
                    <span className="text-gray-400">{it.size && it.size !== "One Size" ? `${it.size} · ` : ""}×{it.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">{o.address.firstName} {o.address.lastName}</p>
                <p className="text-gray-500">{o.address.street}, {o.address.city}, {o.address.state} {o.address.zipcode}</p>
                <p className="text-gray-500">📞 {o.address.phone}</p>
              </div>
              <div className="space-y-1.5 text-sm md:text-right">
                <p className="text-lg font-bold text-gray-800">{currency(o.amount)}</p>
                <p className="text-xs uppercase text-gray-400">{o.paymentMethod} · {o.payment ? "Paid" : "Payment pending"}</p>
                <select value={o.status} onChange={(e) => setStatus(o._id, e.target.value)} className="px-2 py-1.5 text-sm">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="rounded-xl border bg-white p-10 text-center text-gray-400">No orders yet.</p>}
      </div>
    </div>
  );
};

export default Orders;
