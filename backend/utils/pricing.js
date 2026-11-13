export const calcDiscount = (price, mrp) => {
  const p = Number(price) || 0;
  const m = Number(mrp) || 0;
  if (m > p && m > 0) return Math.round(((m - p) / m) * 100);
  return 0;
};

export const shippingConfig = () => ({
  deliveryFee: Number(process.env.DELIVERY_FEE ?? 40),
  freeDeliveryAbove: Number(process.env.FREE_DELIVERY_ABOVE ?? 499),
});

export const deliveryFeeFor = (subtotal) => {
  const { deliveryFee, freeDeliveryAbove } = shippingConfig();
  return subtotal === 0 || subtotal >= freeDeliveryAbove ? 0 : deliveryFee;
};
