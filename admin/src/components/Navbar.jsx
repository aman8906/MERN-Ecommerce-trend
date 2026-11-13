import React from "react";
import { assets } from "../assets/assets";

const Navbar = ({ setToken }) => (
  <div className="sticky top-0 z-50 border-b bg-white">
    <div className="flex items-center justify-between px-[4%] py-2">
      <div className="flex items-center gap-3">
        <img className="w-36" src={assets.logo} alt="Trendify" />
        <span className="rounded-full bg-fuchsia-100 px-3 py-0.5 text-xs font-semibold text-fuchsia-800">Admin</span>
      </div>
      <button onClick={() => setToken("")} className="rounded-full bg-gray-800 px-5 py-2 text-xs text-white sm:px-7 sm:text-sm">
        Logout
      </button>
    </div>
  </div>
);

export default Navbar;
