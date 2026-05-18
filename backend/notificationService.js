const nodemailer = require("nodemailer");
const twilio = require("twilio");

// ─── Email transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ─── Twilio WhatsApp client ───────────────────────────────────────────────────
const getTwilioClient = () => {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token || sid === "your_sid") return null;
  return twilio(sid, token);
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (amount) => `₹${parseFloat(amount || 0).toFixed(2)}`;

const formatItemsText = (items = []) =>
  items.map((i) => `• ${i.name} × ${i.quantity} — ${fmt(i.price)}`).join("\n");

const formatItemsHtml = (items = []) =>
  items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;color:#5C4444;font-size:14px;">${i.name}</td>
        <td style="padding:8px 0;color:#9A8070;font-size:13px;text-align:center;">×${i.quantity}</td>
        <td style="padding:8px 0;color:#1C1212;font-size:14px;font-weight:600;text-align:right;">${fmt(i.price)}</td>
      </tr>`
    )
    .join("");

// ─── Send helpers (fail-silent) ───────────────────────────────────────────────
async function sendEmail(to, subject, html) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[Email] SMTP not configured — skipping "${subject}"`);
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Krittika Style" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${to}`);
  } catch (err) {
    console.error(`[Email] Failed to send "${subject}" to ${to}:`, err.message);
  }
}

async function sendWhatsApp(rawPhone, message) {
  const client = getTwilioClient();
  if (!client) {
    console.log("[WhatsApp] Twilio not configured — skipping message");
    return;
  }
  const digits = (rawPhone || "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) {
    console.warn(`[WhatsApp] Invalid phone "${rawPhone}" — skipping`);
    return;
  }
  const to = `whatsapp:+91${digits}`;
  const from = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER}`;
  try {
    await client.messages.create({ from, to, body: message });
    console.log(`[WhatsApp] Sent to ${to}`);
  } catch (err) {
    console.error(`[WhatsApp] Failed to send to ${to}:`, err.message);
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
const headerHtml = `
  <div style="background:#8B1A1A;padding:28px 40px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;letter-spacing:3px;font-family:Georgia,serif;">KRITTIKA STYLE</h1>
    <p style="color:rgba(255,255,255,0.65);margin:6px 0 0;font-size:12px;letter-spacing:1px;">HANDWOVEN SAREES</p>
  </div>`;

const footerHtml = `
  <div style="background:#1A0A0A;padding:18px;text-align:center;">
    <p style="color:rgba(255,255,255,0.35);font-size:11px;margin:0;">© Krittika Style · Handwoven Sarees · krittikastyle.com</p>
  </div>`;

function confirmationEmailHtml({ orderId, customerName, amount, items }) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #E8DDD6;">
    ${headerHtml}
    <div style="padding:36px 40px;">
      <h2 style="color:#1C1212;font-size:22px;margin:0 0 6px;">Order Confirmed 🎉</h2>
      <p style="color:#5C4444;margin:0 0 24px;font-size:15px;">
        Thank you, <strong>${customerName}</strong>! Your order has been placed successfully.
      </p>

      <div style="background:#FDF8F3;border:1px solid #E8DDD6;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 2px;font-size:11px;color:#9A8070;text-transform:uppercase;letter-spacing:1.5px;">Order ID</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#8B1A1A;">#${orderId}</p>
      </div>

      <h3 style="color:#1C1212;font-size:14px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #E8DDD6;padding-bottom:8px;">Items Ordered</h3>
      <table style="width:100%;border-collapse:collapse;">${formatItemsHtml(items)}</table>
      <div style="border-top:2px solid #8B1A1A;margin-top:10px;padding-top:10px;text-align:right;">
        <span style="font-size:16px;font-weight:700;color:#8B1A1A;">Total: ${amount}</span>
      </div>

      <p style="margin:28px 0 0;color:#9A8070;font-size:13px;text-align:center;line-height:1.7;">
        We'll notify you once your order is shipped.<br>
        Questions? Reply to this email or visit <strong>krittikastyle.com</strong>
      </p>
    </div>
    ${footerHtml}
  </div>`;
}

function cancellationEmailHtml({ orderId, customerName, amount, items }) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border:1px solid #E8DDD6;">
    ${headerHtml}
    <div style="padding:36px 40px;">
      <h2 style="color:#1C1212;font-size:22px;margin:0 0 6px;">Order Cancelled</h2>
      <p style="color:#5C4444;margin:0 0 24px;font-size:15px;">
        Hi <strong>${customerName}</strong>, your order has been cancelled as requested.
      </p>

      <div style="background:#FDF8F3;border:1px solid #E8DDD6;border-radius:8px;padding:18px 20px;margin-bottom:24px;">
        <p style="margin:0 0 2px;font-size:11px;color:#9A8070;text-transform:uppercase;letter-spacing:1.5px;">Cancelled Order ID</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#8B1A1A;">#${orderId}</p>
      </div>

      <h3 style="color:#1C1212;font-size:14px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #E8DDD6;padding-bottom:8px;">Cancelled Items</h3>
      <table style="width:100%;border-collapse:collapse;">${formatItemsHtml(items)}</table>
      <div style="border-top:2px solid #8B1A1A;margin-top:10px;padding-top:10px;text-align:right;">
        <span style="font-size:16px;font-weight:700;color:#8B1A1A;">Total: ${amount}</span>
      </div>

      <div style="background:#FDF8F3;border-left:4px solid #C9952A;padding:14px 16px;margin-top:24px;border-radius:4px;">
        <p style="margin:0;color:#5C4444;font-size:13px;line-height:1.6;">
          If you paid online, your refund will be processed within <strong>5–7 business days</strong> to your original payment method.
        </p>
      </div>

      <p style="margin:28px 0 0;color:#9A8070;font-size:13px;text-align:center;line-height:1.7;">
        We'd love to have you back.<br>
        Browse our collection at <strong>krittikastyle.com</strong>
      </p>
    </div>
    ${footerHtml}
  </div>`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Notify user of a successful order payment.
 * @param {{ order: object, user: object, items: Array }} param0
 */
async function notifyOrderConfirmed({ order, user, items = [] }) {
  const orderId = order.id;
  const customerName = user.name || "Customer";
  const amount = fmt(order.total_amount);

  const emailHtml = confirmationEmailHtml({ orderId, customerName, amount, items });
  const whatsappMsg =
    `✅ *Order Confirmed — Krittika Style*\n\n` +
    `Hi ${customerName}! Your order has been placed.\n\n` +
    `*Order ID:* #${orderId}\n` +
    `*Total:* ${amount}\n\n` +
    `*Items:*\n${formatItemsText(items)}\n\n` +
    `We'll notify you once your order ships. Thank you for shopping with us! 🙏`;

  await Promise.allSettled([
    sendEmail(user.email, `Order Confirmed #${orderId} — Krittika Style`, emailHtml),
    user.phone ? sendWhatsApp(user.phone, whatsappMsg) : Promise.resolve(),
  ]);
}

/**
 * Notify user of an order cancellation.
 * @param {{ order: object, user: object, items: Array }} param0
 */
async function notifyOrderCancelled({ order, user, items = [] }) {
  const orderId = order.id;
  const customerName = user.name || "Customer";
  const amount = fmt(order.total_amount);

  const emailHtml = cancellationEmailHtml({ orderId, customerName, amount, items });
  const whatsappMsg =
    `❌ *Order Cancelled — Krittika Style*\n\n` +
    `Hi ${customerName}, your order has been cancelled.\n\n` +
    `*Order ID:* #${orderId}\n` +
    `*Total:* ${amount}\n\n` +
    `*Items:*\n${formatItemsText(items)}\n\n` +
    `If you paid online, your refund will be processed within 5–7 business days.\n\n` +
    `We hope to see you again! 🙏`;

  await Promise.allSettled([
    sendEmail(user.email, `Order Cancelled #${orderId} — Krittika Style`, emailHtml),
    user.phone ? sendWhatsApp(user.phone, whatsappMsg) : Promise.resolve(),
  ]);
}

module.exports = { notifyOrderConfirmed, notifyOrderCancelled };
