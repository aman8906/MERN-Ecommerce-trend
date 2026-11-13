import React, { useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { ShopContext } from "../context/ShopContext";
import api from "../api";

/** Stripe redirects back here: we verify with the backend (which asks Stripe) before showing success */
const Verify = () => {
  const { navigate, clearCart } = useContext(ShopContext);
  const [params] = useSearchParams();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post("/order/verify-stripe", { orderId: params.get("orderId"), success: params.get("success") });
        if (data.success) { clearCart(); toast.success("Payment successful!"); navigate("/orders"); }
        else { toast.error(data.message || "Payment failed"); navigate("/cart"); }
      } catch { toast.error("Could not verify payment"); navigate("/cart"); }
    })();
    // eslint-disable-next-line
  }, []);

  return <div className="py-32 text-center text-gray-500">Confirming your payment…</div>;
};

export default Verify;
