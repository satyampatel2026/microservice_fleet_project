const paymentApi = "http://localhost:5000/api/client/payments/orders";

async function postPayment(path, body) {
  const response = await fetch(`${paymentApi}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success !== true) {
    throw new Error(data.message || "Payment request failed");
  }

  return data;
}

export async function payForQuote(quoteId) {
  const { order, checkout } = await postPayment("", { quoteId });

  if (order.status === "paid") return { status: "paid",orderId: checkout.razorpayOrderId,};

  if (!window.Razorpay || !checkout?.razorpayOrderId) {
    throw new Error("Razorpay Checkout is unavailable");
  }

  const result = await new Promise((resolve) => {
    const razorpay = new window.Razorpay({
      key: checkout.keyId,
      order_id: checkout.razorpayOrderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: "FleetRova",
      description: "Vehicle service payment",
      handler: resolve,
      modal: { ondismiss: () => resolve(null) },
    });

    razorpay.open();
  });

  if (!result) return { status: "pending" };

  const orderId = checkout.razorpayOrderId;
  const payment = await postPayment(`/${encodeURIComponent(orderId)}/verify`, {
    paymentId: result.razorpay_payment_id,
    signature: result.razorpay_signature,
  });
  return { ...payment, orderId };
}

export async function getPaidOrderWorkshop(orderId) {
  const response = await fetch(
    `${paymentApi}/${encodeURIComponent(orderId)}/workshop`,
    { credentials: "include" }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Unable to load workshop details");
  }

  return data.workshop;
}
export function paymentReceiptUrl(orderId) {
  return paymentApi + "/" + encodeURIComponent(orderId) + "/receipt";
}
