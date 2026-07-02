import nodemailer from "nodemailer";

const getEmailConfig = () => {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  return {
    host,
    port,
    secure: String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true",
    user,
    pass,
    from,
    adminTo: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_ADMIN_TO || user,
  };
};

const isEmailConfigured = () => {
  const config = getEmailConfig();
  return Boolean(config.host && config.user && config.pass && config.from);
};

const createTransporter = () => {
  const config = getEmailConfig();

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
};

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const formatPrice = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
  });
};

const getOrderItemsHtml = (order) => {
  return (order.items || [])
    .map((item) => {
      const product = item.product || {};
      const name = escapeHtml(product.name || "Product");
      const qty = Number(item.qty || 0);
      const unitPrice = Number(item.itemPrice || product.price || 0);
      const price = formatPrice(unitPrice);
      const subtotal = formatPrice(unitPrice * qty);
      const variantText = Array.isArray(item.variants) && item.variants.length
        ? `<br><span style="font-size:12px;color:#666;">${escapeHtml(item.variants.map((variant) => `${variant.group}: ${variant.option}`).join(" | "))}</span>`
        : "";

      return `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;">${name}${variantText}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${qty}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${price}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${subtotal}</td>
        </tr>
      `;
    })
    .join("");
};

const baseOrderHtml = ({ title, order, intro }) => {
  const user = order.user || {};
  const invoiceNumber = `INV-${String(order._id).slice(-8).toUpperCase()}`;
  const invoiceDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `
    <div style="font-family:Arial,sans-serif;color:#222;line-height:1.5;">
      <h2 style="margin:0 0 12px;color:#6b0f1a;">${escapeHtml(title)}</h2>
      <p>${escapeHtml(intro)}</p>
      <p><strong>Invoice No:</strong> ${escapeHtml(invoiceNumber)}</p>
      <p><strong>Invoice Date:</strong> ${escapeHtml(invoiceDate)}</p>
      <p><strong>Order ID:</strong> ${escapeHtml(order._id)}</p>
      <p><strong>Status:</strong> ${escapeHtml(order.status || "Pending")}</p>
      <p><strong>Customer:</strong> ${escapeHtml(user.name || user.mobile || "Customer")}</p>
      <p><strong>Email:</strong> ${escapeHtml(user.email || "Not provided")}</p>
      <p><strong>Address:</strong> ${escapeHtml(order.address || "")}</p>
      <p><strong>Payment:</strong> ${escapeHtml(order.paymentMethod || "COD")} (${escapeHtml(order.paymentStatus || "Pending")})</p>

      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr>
            <th style="padding:8px;border-bottom:2px solid #ddd;text-align:left;">Product</th>
            <th style="padding:8px;border-bottom:2px solid #ddd;text-align:center;">Qty</th>
            <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Price</th>
            <th style="padding:8px;border-bottom:2px solid #ddd;text-align:right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>${getOrderItemsHtml(order)}</tbody>
      </table>

      <h3 style="text-align:right;margin:0;">Total: ${formatPrice(order.total)}</h3>
    </div>
  `;
};

const sendEmail = async ({ to, subject, html }) => {
  if (!to) return;

  if (!isEmailConfigured()) {
    console.log(`Email skipped for ${to}: SMTP config missing`);
    return;
  }

  const config = getEmailConfig();
  const transporter = createTransporter();

  await transporter.sendMail({
    from: config.from,
    to,
    subject,
    html,
  });
};

export const sendOrderPlacedEmails = async (order) => {
  const config = getEmailConfig();
  const customerEmail = order.user?.email;
  const adminEmail = config.adminTo;
  const invoiceNumber = `INV-${String(order._id).slice(-8).toUpperCase()}`;

  await Promise.all([
    sendEmail({
      to: customerEmail,
      subject: `Invoice ${invoiceNumber} - Order confirmed`,
      html: baseOrderHtml({
        title: "Tax Invoice",
        intro: "Thank you for your order. Your invoice details are below.",
        order,
      }),
    }),
    sendEmail({
      to: adminEmail,
      subject: `Admin invoice ${invoiceNumber} - New order received`,
      html: baseOrderHtml({
        title: "Admin Tax Invoice Copy",
        intro: "A new customer order has been placed. Invoice details are below.",
        order,
      }),
    }),
  ]);
};

export const sendOrderStatusEmail = async (order) => {
  const customerEmail = order.user?.email;

  await sendEmail({
    to: customerEmail,
    subject: `Order update - ${order.status}`,
    html: baseOrderHtml({
      title: `Order ${order.status}`,
      intro: `Your order status is now ${order.status}.`,
      order,
    }),
  });
};
