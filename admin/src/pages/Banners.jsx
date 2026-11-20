import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminApi, errMsg } from "../api";

const POSITIONS = {
  hero: { label: "Hero slider (top of home)", size: "1600 × 600 px" },
  strip: { label: "Promo card (middle of home)", size: "800 × 400 px" },
};

const Banners = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [banners, setBanners] = useState([]);
  const blank = { title: "", subtitle: "", link: "/collection", order: 0, position: "hero" };
  const [f, setF] = useState(blank);
  const [image, setImage] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => api.get("/banner/admin-list").then((r) => setBanners(r.data.banners || [])).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [api]); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Choose a banner image");
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append("image", image);
      const { data } = await api.post("/banner/add", fd);
      if (data.success) { toast.success(data.message); setF(blank); setImage(null); load(); }
    } catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };

  const act = async (path, id) => {
    try { const { data } = await api.post(`/banner/${path}`, { id }); toast.info(data.message); load(); } catch (err) { toast.error(errMsg(err)); }
  };

  const group = (pos) => banners.filter((b) => (b.position || "hero") === pos);

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Home Banners</h1>

      <form onSubmit={add} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700">Where should it show?</p>
            <select value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} className="w-full px-3 py-2">
              {Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <p className="mt-1 text-xs text-gray-400">Best image size: {POSITIONS[f.position].size}. Text is shown on the left side of the image.</p>
          </div>
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700">Order (small number shows first)</p>
            <input type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} className="w-full px-3 py-2" />
          </div>
          <input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="px-3 py-2" required />
          <input placeholder="Subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} className="px-3 py-2" />
          <input placeholder="Link, e.g. /collection?category=Electronics" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} className="px-3 py-2 sm:col-span-2" />
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-sm" />
          <button disabled={busy} className="ml-auto rounded-lg bg-fuchsia-700 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">{busy ? "Uploading…" : "Add banner"}</button>
        </div>
        <p className="text-xs text-gray-400">With no banners the store shows ready-made default slides and cards, so the home page is never empty.</p>
      </form>

      {Object.entries(POSITIONS).map(([pos, meta]) => (
        <div key={pos}>
          <h2 className="mb-2 font-bold text-gray-800">{meta.label} <span className="text-sm font-normal text-gray-400">({group(pos).length})</span></h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {group(pos).map((b) => (
              <div key={b._id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${b.active ? "" : "opacity-50"}`}>
                <img src={b.image} alt="" className="h-32 w-full object-cover" />
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-gray-800">{b.title}</p>
                    <p className="truncate text-xs text-gray-400">{b.link} · order {b.order}</p>
                  </div>
                  <button onClick={() => act("toggle", b._id)} className="text-sm text-gray-600">{b.active ? "Hide" : "Show"}</button>
                  <button onClick={() => window.confirm("Delete banner?") && act("remove", b._id)} className="text-sm text-red-600">Delete</button>
                </div>
              </div>
            ))}
            {group(pos).length === 0 && <p className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-gray-400 sm:col-span-2">No banners here yet.</p>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Banners;