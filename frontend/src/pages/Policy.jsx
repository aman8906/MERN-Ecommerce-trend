import React, { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { SITE } from "../config/site";
import NotFound from "./NotFound";

/**
 * Privacy / Terms / Returns / Shipping pages (payment gateways such as Razorpay and Stripe ask for these URLs).
 * These are STARTER TEXTS. Edit them to match how your business really works and have a legal professional review them.
 */
const build = (c) => ({
  privacy: {
    title: "Privacy Policy",
    intro: `${SITE.name} ("we", "us") respects your privacy. This page explains what we collect when you use ${SITE.domain} and how we use it.`,
    sections: [
      ["What we collect", "Your name, email, phone number and delivery address when you create an account or place an order; your order history; items in your cart and wishlist; and basic technical data such as browser type and the pages you view."],
      ["Payments", "Online payments are processed by Razorpay and Stripe. Your card, UPI or bank details go directly to them and are never stored on our servers."],
      ["How we use it", "To process and deliver orders, send order updates, provide customer support, prevent fraud, and improve the shop (for example, showing what is trending). If you subscribe to our newsletter we send you offers and new arrivals; you can unsubscribe at any time."],
      ["Who we share it with", "Only with the services that help us run the shop: delivery partners (name, address, phone), payment gateways, and hosting and image services. We do not sell your personal information."],
      ["Cookies and local storage", "We store your login, cart, wishlist and recently viewed items in your browser so the shop works as you expect. Clearing your browser data removes them."],
      ["Security", "Passwords are stored in encrypted (hashed) form and the site is served over HTTPS. No online system is perfectly secure, but we work to protect your data."],
      ["Your choices", `You can ask us to access, correct or delete your data by emailing ${SITE.email}. Some order records must be kept by law for accounting purposes.`],
      ["Contact", `Questions about this policy: ${SITE.email}, ${SITE.address}.`],
    ],
  },
  terms: {
    title: "Terms & Conditions",
    intro: `By using ${SITE.domain} or placing an order you agree to these terms.`,
    sections: [
      ["Using the shop", "You must provide correct information, keep your password private, and not misuse the site (for example, attempting to disrupt it or place fraudulent orders)."],
      ["Prices and availability", "All prices are in Indian Rupees (₹) and include applicable taxes unless stated. Prices and stock can change without notice. If we find a pricing or stock error after you order, we may cancel the order and refund any payment made."],
      ["Orders", "An order is confirmed when you receive an order confirmation. We may cancel orders that appear fraudulent or that we cannot fulfil."],
      ["Payments", "We accept Cash on Delivery (where available), UPI, cards and netbanking through Razorpay, and cards through Stripe."],
      ["Shipping, returns and refunds", "Delivery and returns are governed by our Shipping Policy and Returns & Refund Policy, which form part of these terms."],
      ["Product information", "We try to show colours and details accurately, but screens differ and small variations can occur."],
      ["Intellectual property", `The ${SITE.name} name, logo, design and content belong to us or our licensors and may not be copied without permission.`],
      ["Limitation of liability", "To the extent permitted by law, we are not liable for indirect or consequential losses. Our liability for any order is limited to the amount you paid for it."],
      ["Governing law", "These terms are governed by the laws of India. Disputes are subject to the courts at our registered office location."],
      ["Changes", "We may update these terms from time to time. The date at the top of this page shows the latest version."],
    ],
  },
  returns: {
    title: "Returns & Refund Policy",
    intro: "We want you to be happy with your order. If you are not, here is how returns, exchanges and refunds work.",
    sections: [
      ["10-day returns and exchanges", "You can return or exchange most items within 10 days of delivery."],
      ["Conditions", "Items must be unused, unwashed, with tags and original packaging. For hygiene reasons innerwear, opened beauty and personal-care products, and earrings cannot be returned unless they arrive damaged or wrong."],
      ["How to request", `Go to My Orders, or email ${SITE.email} with your order number and clear photos if the item is damaged or incorrect. Report damaged or wrong items within 48 hours of delivery.`],
      ["Pickup and inspection", "We will arrange a pickup or tell you how to send the item back. Returned items are checked before a refund or exchange is approved."],
      ["Refunds", "Approved refunds go to your original payment method within 5 to 7 business days. For Cash on Delivery orders we refund by bank transfer or UPI, so we may ask for those details."],
      ["Cancelling an order", "You can cancel from My Orders while the order is still at the \"Order Placed\" stage. After it has been packed or shipped, please use the return process once it arrives."],
      ["Need help?", `Write to ${SITE.email} or call ${SITE.phone} (${SITE.hours}).`],
    ],
  },
  shipping: {
    title: "Shipping & Delivery Policy",
    intro: "Here is how and when your order reaches you.",
    sections: [
      ["Where we deliver", "We deliver to most PIN codes across India. If your PIN code is not serviceable, we will tell you before you pay."],
      ["Processing time", "Orders are packed within 1 to 2 business days after they are placed."],
      ["Delivery time", "Delivery usually takes 3 to 5 business days after dispatch, and up to 7 business days to remote areas. Public holidays and weather can cause delays."],
      ["Delivery charges", c.freeDeliveryAbove ? `Delivery is free on orders of ₹${c.freeDeliveryAbove} or more. Below that, a delivery charge of ₹${c.deliveryFee} applies. The exact charge is shown in your cart before you pay.` : "Delivery charges, if any, are shown in your cart before you pay."],
      ["Cash on Delivery", "Cash on Delivery is available on eligible orders. Please keep the exact amount ready."],
      ["Tracking your order", "You can see your order status (Order Placed, Packed, Shipped, Out for Delivery, Delivered) under My Orders."],
      ["Failed delivery", "If you are unreachable or refuse delivery, the courier may try again and then return the order to us. Refunds for returned prepaid orders follow our Returns & Refund Policy."],
      ["Damaged in transit", `Please check the package on delivery and write to ${SITE.email} within 48 hours if anything is damaged.`],
    ],
  },
});

const LINKS = [["privacy", "Privacy Policy"], ["terms", "Terms & Conditions"], ["returns", "Returns & Refunds"], ["shipping", "Shipping & Delivery"]];

const Policy = () => {
  const { slug } = useParams();
  const { config } = useContext(ShopContext);
  const page = build(config)[slug];
  if (!page) return <NotFound />;

  const go = SITE.grievanceOfficer;
  return (
    <div className="grid gap-8 py-6 sm:py-10 md:grid-cols-[220px_1fr]">
      <nav className="flex gap-2 overflow-x-auto md:flex-col md:gap-1">
        {LINKS.map(([k, label]) => (
          <Link key={k} to={`/policy/${k}`} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${k === slug ? "bg-brand-light text-brand" : "text-gray-600 hover:bg-gray-100"}`}>
            {label}
          </Link>
        ))}
      </nav>

      <article className="max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{page.title}</h1>
        <p className="mt-1 text-xs text-gray-400">Last updated: {SITE.updated}</p>
        <p className="mt-4 text-gray-600">{page.intro}</p>
        <div className="mt-6 space-y-6">
          {page.sections.map(([h, p], i) => (
            <section key={h}>
              <h2 className="text-lg font-semibold text-gray-900">{i + 1}. {h}</h2>
              <p className="mt-1 leading-relaxed text-gray-600">{p}</p>
            </section>
          ))}
        </div>
        <div className="mt-8 rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">Grievance / Customer care</p>
          <p>{go.name} · <a className="text-brand" href={`mailto:${go.email}`}>{go.email}</a></p>
          <p>{SITE.address}</p>
        </div>
      </article>
    </div>
  );
};

export default Policy;