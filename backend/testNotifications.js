require("dotenv").config();
const { notifyOrderConfirmed, notifyOrderCancelled } = require("./notificationService");

const mockOrder = {
  id: 9999,
  total_amount: 2499.00,
};

const mockUser = {
  id: 1,
  name: "Test Customer",
  email: process.env.SMTP_USER, // send to self as a test
  phone: "",                    // leave blank to skip WhatsApp (Twilio not configured yet)
};

const mockItems = [
  { name: "Banarasi Silk Saree",   quantity: 1, price: 1999.00 },
  { name: "Cotton Handloom Saree", quantity: 1, price: 500.00  },
];

async function run() {
  console.log("\n─── Testing Order Confirmation Notification ───");
  await notifyOrderConfirmed({ order: mockOrder, user: mockUser, items: mockItems });

  console.log("\n─── Testing Order Cancellation Notification ───");
  await notifyOrderCancelled({ order: mockOrder, user: mockUser, items: mockItems });

  console.log("\n✅ Test complete. Check the inbox at:", mockUser.email);
}

run().catch((e) => console.error("Test failed:", e.message));
