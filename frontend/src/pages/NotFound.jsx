import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="py-24 text-center">
    <p className="text-7xl font-extrabold text-brand">404</p>
    <p className="mt-3 text-xl font-semibold text-gray-800">This page could not be found</p>
    <p className="mt-1 text-sm text-gray-500">The link may be old, or the page may have moved.</p>
    <div className="mt-6 flex justify-center gap-3">
      <Link to="/" className="rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">Go to home</Link>
      <Link to="/collection" className="rounded-lg border border-brand px-6 py-3 text-sm font-bold text-brand hover:bg-brand-light">Browse products</Link>
    </div>
  </div>
);

export default NotFound;