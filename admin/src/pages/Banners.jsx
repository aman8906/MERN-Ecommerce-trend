import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminApi, errMsg } from "../api";

const Banners = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [banners, setBanners] = useState([]);
  const [f, setF] = useState({ title: "", subtitle: "", link: "/collection", order: 0 });
  const [image, setImage] = useState(null);

  const load = () => api.get("/banner/admin-list").then((r) => setBanners(r.data.banners || [])).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [api]); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Choose a banner image");
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append("image", image);
      const { data } = await api.post("/banner/add", fd);
      if (data.success) { toast.success(data.message); setF({ title: "", subtitle: "", link: "/collection", order: 0 }); setImage(null); load(); }
    } catch (err) { toast.error(errMsg(err)); }
  };

  const act = async (path, id) => {
    try { const { data } = await api.post(`/banner/${path}`, { id }); toast.info(data.message); load(); } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Home Banners</h1>
      <form onSubmit={add} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-400">Recommended size: 1600 × 600 px. Text is overlaid on the left side. With no banners, the store shows default gradient slides.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="px-3 py-2" required />
          <input placeholder="Subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="px-3 py-2" />
          <input placeholder="Link, e.g. /collection?category=Electronics" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} className="px-3 py-2" />
          <input type="number" placeholder="Order" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} className="px-3 py-2" />
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-sm" />
          <button className="ml-auto rounded-lg bg-fuchsia-700 px-5 py-2 text-sm font-semibold text-white">Add banner</button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {banners.map((b) => (
          <div key={b._id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${b.active ? "" : "opacity-50"}`}>
            <img src={b.image} alt="" className="h-32 w-full object-cover" />
            <div className="flex items-center gap-2 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-800">{b.title}</p>
                <p className="truncate text-xs text-gray-400">{b.link}</p>
              </div>
              <button onClick={() => act("toggle", b._id)} className="text-sm text-gray-600">{b.active ? "Hide" : "Show"}</button>
              <button onClick={() => window.confirm("Delete banner?") && act("remove", b._id)} className="text-sm text-red-600">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Banners;
