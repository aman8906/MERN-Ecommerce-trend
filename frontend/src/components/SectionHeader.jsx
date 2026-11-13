import React from "react";
import { Link } from "react-router-dom";
import { ChevronIcon } from "./Icons";

const SectionHeader = ({ title, subtitle, icon, to, right }) => (
  <div className="mb-3 flex items-end justify-between gap-3">
    <div>
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 sm:text-2xl">
        {icon}
        {title}
      </h2>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{subtitle}</p>}
    </div>
    <div className="flex items-center gap-3">
      {right}
      {to && (
        <Link to={to} className="flex items-center gap-0.5 whitespace-nowrap rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand hover:text-white sm:text-sm">
          View all <ChevronIcon size={14} />
        </Link>
      )}
    </div>
  </div>
);

export default SectionHeader;
