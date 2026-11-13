import React, { useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import api from "../api";

const Login = () => {
  const { token, setToken, navigate } = useContext(ShopContext);
  const location = useLocation();
  const [mode, setMode] = useState("Login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const on = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const next = location.state?.from || "/";

  useEffect(() => { if (token) navigate(next, { replace: true }); }, [token]); // eslint-disable-line

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post(mode === "Login" ? "/user/login" : "/user/register", form);
      if (data.success) { setToken(data.token, data.name); toast.success(mode === "Login" ? "Welcome back!" : "Account created!"); }
      else toast.error(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    }
    setBusy(false);
  };

  const input = "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="mx-auto my-8 w-full max-w-md sm:my-14">
      <form onSubmit={onSubmitHandler} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h1 className="text-2xl font-bold">{mode === "Login" ? "Welcome back" : "Create your account"}</h1>
          <p className="text-sm text-gray-500">{mode === "Login" ? "Login to see your cart, orders and wishlist everywhere." : "Join Trendify for exclusive deals and fast checkout."}</p>
        </div>
        {mode !== "Login" && <input name="name" value={form.name} onChange={on} className={input} placeholder="Full name" required />}
        <input name="email" type="email" value={form.email} onChange={on} className={input} placeholder="Email address" required />
        <input name="password" type="password" value={form.password} onChange={on} className={input} placeholder="Password (min 8 characters)" minLength={mode === "Login" ? 1 : 8} required />
        <button disabled={busy} className="w-full rounded-lg bg-brand py-3 font-bold text-white hover:bg-brand-dark disabled:opacity-60">
          {busy ? "Please wait…" : mode === "Login" ? "Login" : "Sign up"}
        </button>
        <p className="text-center text-sm text-gray-600">
          {mode === "Login" ? "New to Trendify?" : "Already have an account?"}{" "}
          <button type="button" onClick={() => setMode(mode === "Login" ? "Sign Up" : "Login")} className="font-semibold text-brand">
            {mode === "Login" ? "Create an account" : "Login"}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
