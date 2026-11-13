export const money = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const compact = (n) => {
  n = Number(n || 0);
  if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, "") + "L";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};

export const deliveryDate = (minDays = 3, maxDays = 5) => {
  const f = (d) => new Date(Date.now() + d * 864e5).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return `${f(minDays)} – ${f(maxDays)}`;
};
