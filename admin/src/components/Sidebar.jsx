import React from "react";
import { NavLink } from "react-router-dom";

const links = [
  ["/", "📊", "Dashboard", true],
  ["/orders", "🧾", "Orders"],
  ["/list", "📦", "Products"],
  ["/add", "➕", "Add Product"],
  ["/categories", "🗂️", "Categories"],
  ["/banners", "🖼️", "Banners"],
];

const Sidebar = () => (
  <aside className="sticky top-0 h-screen w-14 shrink-0 border-r bg-white md:w-56">
    <div className="flex flex-col gap-1 p-2 pt-4 md:p-3">
      {links.map(([to, icon, label, end]) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium md:justify-start ${
              isActive ? "bg-fuchsia-100 text-fuchsia-800" : "text-gray-600 hover:bg-gray-100"
            }`
          }
          style={{ border: "none" }}
        >
          <span className="text-lg">{icon}</span>
          <span className="hidden md:block">{label}</span>
        </NavLink>
      ))}
    </div>
  </aside>
);

export default Sidebar;
