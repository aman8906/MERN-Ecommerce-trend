import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { adminApi, errMsg } from "../api";

const EMOJIS = ["👗", "👔", "🧸", "🎧", "🏠", "💄", "👟", "💍", "🏏", "🎮", "📚", "🛒", "📱", "💻", "⌚", "🧴", "🍫", "🪑", "🚗", "🐶"];

const Categories = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ name: "", icon: "🛒", subCategories: "", order: 0 });
  const [image, setImage] = useState(null);
  const [edit, setEdit] = useState(null); // category being edited

  const load = () => api.get("/category/admin-list").then((r) => setCats(r.data.categories || [])).catch((e) => toast.error(errMsg(e)));
  useEffect(() => { load(); }, [api]); // eslint-disable-line

  const add = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      if (image) fd.append("image", image);
      const { data } = await api.post("/category/add", fd);
      if (data.success) { toast.success(data.message); setF({ name: "", icon: "🛒", subCategories: "", order: 0 }); setImage(null); load(); }
    } catch (err) { toast.error(errMsg(err)); }
  };

  const save = async () => {
    try {
      const { data } = await api.post("/category/update", { id: edit._id, name: edit.name, icon: edit.icon, order: edit.order, subCategories: edit.subText, active: edit.active });
      if (data.success) { toast.success(data.message); setEdit(null); load(); }
    } catch (err) { toast.error(errMsg(err)); }
  };

  const toggle = async (c) => {
    try { await api.post("/category/update", { id: c._id, active: !c.active }); load(); } catch (err) { toast.error(errMsg(err)); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try { const { data } = await api.post("/category/remove", { id: c._id }); toast.info(data.message); load(); }
    catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Categories</h1>

      <form onSubmit={add} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
        <p className="font-semibold text-gray-800">Add a category</p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_90px]">
          <input placeholder="Name (e.g. Mobiles)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="px-3 py-2" required />
          <input placeholder="Sub categories, comma separated" value={f.subCategories} onChange={(e) => setF({ ...f, subCategories: e.target.value })} className="px-3 py-2" />
          <input type="number" placeholder="Order" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} className="px-3 py-2" />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm">Icon:</span>
          {EMOJIS.map((e) => <button type="button" key={e} onClick={() => setF({ ...f, icon: e })} className={`rounded p-1 text-xl ${f.icon === e ? "bg-fuchsia-100 ring-2 ring-fuchsia-600" : "hover:bg-gray-100"}`}>{e}</button>)}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">Photo (optional, for the home grid): <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} className="text-xs" /></label>
          <button className="ml-auto rounded-lg bg-fuchsia-700 px-5 py-2 text-sm font-semibold text-white">Add category</button>
        </div>
      </form>

      <div className="divide-y rounded-xl border bg-white shadow-sm">
        {cats.map((c) => (
          <div key={c._id} className="p-3">
            {edit?._id === c._id ? (
              <div className="space-y-2">
                <div className="grid gap-2 sm:grid-cols-[60px_1fr_1fr_80px]">
                  <input value={edit.icon} onChange={(e) => setEdit({ ...edit, icon: e.target.value })} className="px-2 py-1 text-center text-xl" />
                  <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="px-2 py-1" />
                  <input value={edit.subText} onChange={(e) => setEdit({ ...edit, subText: e.target.value })} className="px-2 py-1" placeholder="Sub categories" />
                  <input type="number" value={edit.order} onChange={(e) => setEdit({ ...edit, order: e.target.value })} className="px-2 py-1" />
                </div>
                <div className="flex gap-2">
                  <button onClick={save} className="rounded bg-fuchsia-700 px-4 py-1 text-sm font-semibold text-white">Save</button>
                  <button onClick={() => setEdit(null)} className="rounded bg-gray-200 px-4 py-1 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-3xl">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold ${c.active ? "text-gray-800" : "text-gray-400 line-through"}`}>{c.name}</p>
                  <p className="truncate text-xs text-gray-400">{c.subCategories.join(" · ") || "No sub categories"}</p>
                </div>
                <button onClick={() => setEdit({ ...c, subText: c.subCategories.join(", ") })} className="text-sm text-fuchsia-700">Edit</button>
                <button onClick={() => toggle(c)} className="text-sm text-gray-500">{c.active ? "Hide" : "Show"}</button>
                <button onClick={() => remove(c)} className="text-sm text-red-600">Delete</button>
              </div>
            )}
          </div>
        ))}
        {cats.length === 0 && <p className="p-6 text-center text-gray-400">No categories yet. Run <code>npm run seed</code> in the backend or add one above.</p>}
      </div>
    </div>
  );
};

export default Categories;
