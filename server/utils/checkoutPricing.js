export const FREE_SHIPPING_MINIMUM = 999;
export const DELIVERY_CHARGE = 99;

export const PAYMENT_METHOD_DISCOUNTS = {
  UPI: 5,
  CARD: 2,
  WALLET: 3,
  COD: 0,
};

export const normalizeSelectedPaymentMethod = (value) => {
  const method = String(value || "").trim().toUpperCase();
  return Object.hasOwn(PAYMENT_METHOD_DISCOUNTS, method) ? method : "";
};

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));

export const calculateCheckoutPricing = (subtotal, selectedPaymentMethod) => {
  const originalAmount = roundMoney(subtotal);
  const method = normalizeSelectedPaymentMethod(selectedPaymentMethod);

  if (!method) {
    throw new Error("A valid payment method is required");
  }

  const shippingCharge =
    originalAmount > 0 && originalAmount < FREE_SHIPPING_MINIMUM
      ? DELIVERY_CHARGE
      : 0;
  const discountPercent = PAYMENT_METHOD_DISCOUNTS[method];
  const discountAmount = roundMoney((originalAmount * discountPercent) / 100);
  const finalPayableAmount = roundMoney(
    Math.max(0, originalAmount + shippingCharge - discountAmount)
  );

  return {
    originalAmount,
    shippingCharge,
    discountPercent,
    discountAmount,
    finalPayableAmount,
    selectedPaymentMethod: method,
  };
};
