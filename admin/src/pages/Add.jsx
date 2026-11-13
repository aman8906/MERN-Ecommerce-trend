import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { adminApi, errMsg } from "../api";

const CLOTHING = ["S", "M", "L", "XL", "XXL"];
const SHOES = ["5", "6", "7", "8", "9", "10", "11"];

const Add = ({ token }) => {
  const api = useMemo(() => adminApi(token), [token]);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([null, null, null, null]);
  const [f, setF] = useState({ name: "", description: "", category: "", subCategory: "", brand: "", price: "", mrp: "", stock: "100", tags: "" });
  const [sizes, setSizes] = useState([]);
  const [bestSeller, setBestSeller] = useState(false);
  const [trendingPin, setTrendingPin] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { api.get("/category/admin-list").then((r) => setCategories(r.data.categories || [])).catch(() => {}); }, [api]);

  const on = (e) => setF((x) => ({ ...x, [e.target.name]: e.target.value }));
  const cat = categories.find((c) => c.name === f.category);
  const discount = Number(f.mrp) > Number(f.price) && Number(f.price) > 0 ? Math.round(((f.mrp - f.price) / f.mrp) * 100) : 0;

  const reset = () => {
    setImages([null, null, null, null]);
    setF({ name: "", description: "", category: "", subCategory: "", brand: "", price: "", mrp: "", stock: "100", tags: "" });
    setSizes([]); setBestSeller(false); setTrendingPin(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!images.some(Boolean)) return toast.error("Upload at least one image");
    setBusy(true);
    try {
      const fd = new FormData();
      images.forEach((img, i) => img && fd.append(`image${i + 1}`, img));
      Object.entries(f).forEach(([k, v]) => fd.append(k, v));
      fd.append("sizes", JSON.stringify(sizes));
      fd.append("bestSeller", bestSeller);
      fd.append("trendingPin", trendingPin);
      const { data } = await api.post("/product/add", fd);
      if (data.success) { toast.success(data.message); reset(); } else toast.error(data.message);
    } catch (err) { toast.error(errMsg(err)); }
    setBusy(false);
  };

  const Label = ({ children }) => <p className="mb-1.5 text-sm font-semibold text-gray-700">{children}</p>;
  const toggleSize = (s) => setSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-gray-800">Add Product</h1>

      <div>
        <Label>Images (first image is the cover)</Label>
        <div className="flex gap-2">
          {images.map((img, i) => (
            <label key={i} className="cursor-pointer">
              <img className="h-24 w-20 rounded-lg border-2 border-dashed border-gray-400 object-cover" src={img ? URL.createObjectURL(img) : assets.upload_area} alt="" />
              <input hidden type="file" accept="image/*" onChange={(e) => setImages((p) => p.map((x, j) => (j === i ? e.target.files[0] : x)))} />
            </label>
          ))}
        </div>
      </div>

      <div><Label>Product name</Label><input name="name" value={f.name} onChange={on} className="w-full px-3 py-2" required /></div>
      <div><Label>Description</Label><textarea name="description" value={f.description} onChange={on} rows={4} className="w-full px-3 py-2" required /></div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Category</Label>
          <select name="category" value={f.category} onChange={(e) => setF((x) => ({ ...x, category: e.target.value, subCategory: "" }))} className="w-full px-3 py-2" required>
            <option value="">Select</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div>
          <Label>Sub category</Label>
          <select name="subCategory" value={f.subCategory} onChange={on} className="w-full px-3 py-2" disabled={!cat?.subCategories.length}>
            <option value="">{cat?.subCategories.length ? "Select" : "None"}</option>
            {cat?.subCategories.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div><Label>Brand</Label><input name="brand" value={f.brand} onChange={on} className="w-full px-3 py-2" placeholder="e.g. Trendify" /></div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div><Label>Selling price (₹)</Label><input name="price" type="number" min="0" value={f.price} onChange={on} className="w-full px-3 py-2" required /></div>
        <div>
          <Label>MRP (₹) {discount > 0 && <span className="font-normal text-green-600">→ {discount}% off</span>}</Label>
          <input name="mrp" type="number" min="0" value={f.mrp} onChange={on} className="w-full px-3 py-2" placeholder="original price" />
        </div>
        <div><Label>Stock</Label><input name="stock" type="number" min="0" value={f.stock} onChange={on} className="w-full px-3 py-2" required /></div>
      </div>

      <div>
        <Label>Sizes <span className="font-normal text-gray-400">(leave empty if not applicable)</span></Label>
        <div className="flex flex-wrap gap-2">
          {[...CLOTHING, ...SHOES].map((s, i) => (
            <button type="button" key={s + i} onClick={() => toggleSize(s)} className={`rounded-md px-3 py-1 ${i >= CLOTHING.length ? "ring-1 ring-gray-300" : ""} ${sizes.includes(s) ? "bg-fuchsia-700 text-white" : "bg-slate-200"}`}>{s}</button>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-400">Pills with an outline are footwear sizes.</p>
      </div>

      <div><Label>Search tags <span className="font-normal text-gray-400">(comma separated)</span></Label><input name="tags" value={f.tags} onChange={on} className="w-full px-3 py-2" placeholder="cotton, summer, casual" /></div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={bestSeller} onChange={() => setBestSeller((v) => !v)} /> Best seller</label>
        <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={trendingPin} onChange={() => setTrendingPin((v) => !v)} /> 🔥 Boost in "Trending now"</label>
      </div>

      <div className="flex gap-3">
        <button disabled={busy} className="rounded-lg bg-fuchsia-700 px-6 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Uploading…" : "Add product"}</button>
        <button type="button" onClick={reset} className="rounded-lg bg-slate-300 px-6 py-2.5 font-semibold text-slate-800">Reset</button>
      </div>
    </form>
  );
};

export default Add;
