import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import SectionHeader from "./SectionHeader";

const TINTS = ["bg-pink-50", "bg-blue-50", "bg-amber-50", "bg-emerald-50", "bg-purple-50", "bg-orange-50", "bg-cyan-50", "bg-rose-50"];

const CategoryGrid = () => {
  const { categories } = useContext(ShopContext);
  if (!categories.length) return null;
  return (
    <section>
      <SectionHeader title="Shop by Category" subtitle="Everything you need, in one place" />
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-4 lg:grid-cols-8">
        {categories.map((c, i) => (
          <Link key={c._id} to={`/collection?category=${encodeURIComponent(c.name)}`} className="group flex flex-col items-center gap-1.5 text-center">
            <div className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl ${TINTS[i % TINTS.length]} transition group-hover:shadow-md group-hover:-translate-y-0.5`}>
              {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : <span className="text-3xl sm:text-5xl">{c.icon}</span>}
            </div>
            <span className="line-clamp-2 text-[11px] font-medium leading-tight text-gray-700 sm:text-sm">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;
