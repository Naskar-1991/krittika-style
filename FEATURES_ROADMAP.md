# Krittika Style — Feature Roadmap

**Platform:** E-commerce (Sarees)  
**Stack:** React · Node/Express · PostgreSQL · Razorpay · Shiprocket  
**Document Date:** April 2026

---

## 1. Current Platform Capabilities

### Customer-Facing
- Product listing with category sidebar, search, sort, price filter
- Product detail page with reviews and star ratings
- Shopping cart and checkout with Razorpay payment gateway
- Wishlist
- Live order tracking with Shiprocket integration (stepper UI)
- Order cancellation (synced to Shiprocket dashboard)
- Returns request and My Returns page
- OTP-verified authentication (Login / Signup)
- User profile page
- Newsletter subscription section

### Admin Panel
- Dashboard overview
- Manage Products, Categories, Orders, Users
- Admin Returns management
- Admin Reviews moderation
- Logo / branding management

### Backend / Infrastructure
- PostgreSQL database
- Express.js REST API
- Shiprocket shipping integration
- Razorpay payment integration
- JWT-based authentication
- File uploads (product images, logo)

---

## 2. Feature Roadmap

---

### Phase 1 — High Impact (Month 1–2)

#### 2.1 Coupon / Promo Codes
- Admin creates codes with fixed amount or percentage discount
- Customer enters code at checkout
- Supports expiry dates and usage limits
- **Why:** Direct revenue lever. Simple to build (~2 days).

#### 2.2 Size / Variant Selection
- Products can have variants: blouse size, colour, fabric weight
- Each variant has its own stock count and optional price delta
- Selected variant shown on order detail and invoice
- **Why:** Sarees often require blouse sizes. Currently missing — causing drop-offs.

#### 2.3 Transactional Email Notifications
- Order placed confirmation (with order summary)
- Shipment dispatched (with tracking link)
- Return status updates (approved / rejected)
- Powered by Nodemailer + SendGrid or AWS SES
- **Why:** Customers expect post-purchase communication. Reduces support queries.

#### 2.4 Cash on Delivery (COD)
- COD option at checkout for orders below a configurable threshold (e.g. ₹5000)
- Admin marks COD orders as paid on delivery
- **Why:** High COD preference among Indian saree buyers, especially first-time customers.

#### 2.5 Product Image Gallery
- Multiple images per product (upload up to 6)
- Thumbnail rail on product detail page
- Click-to-enlarge / zoom on hover
- **Why:** Saree fabric and border details need to be seen from multiple angles. Single image loses sales.

#### 2.6 Low Stock / Urgency Badge
- "Only 3 left" badge when stock ≤ configured threshold
- Out-of-stock overlay on product card and detail page
- **Why:** Creates urgency and reduces disappointment from discovering stock issues at checkout.

---

### Phase 2 — Growth Features (Month 2–3)

#### 2.7 Address Book
- Customers save multiple delivery addresses in their profile
- Select saved address at checkout instead of re-entering
- Supports "Home", "Office", "Other" labels
- **Why:** Reduces checkout friction for repeat buyers.

#### 2.8 Recently Viewed Products
- Last 8 viewed products stored in localStorage
- Shown on homepage and product detail page
- **Why:** Easy to build (~4 hours). Measurably improves return-to-cart rate.

#### 2.9 Product Recommendations
- "You may also like" — products from the same category
- "Complete the look" — manually curated pairs (saree + dupatta, etc.)
- Shown on product detail and cart pages
- **Why:** Increases average order value with minimal backend work.

#### 2.10 Referral / Share Discount
- Unique referral link generated per user
- Referee gets ₹X off first order; referrer gets ₹X credit on successful order
- Shareable via WhatsApp / copy link
- **Why:** Sarees are heavily word-of-mouth. Creates a viral loop within the target demographic.

#### 2.11 Downloadable Order Invoice (PDF)
- PDF invoice generated per order with GST breakdown, product details, address
- Downloadable from My Orders page
- Powered by `pdfkit` on the backend
- **Why:** Expected by customers for personal records and business expense claims.

#### 2.12 Loyalty Points System
- Earn points for every ₹100 spent (configurable rate)
- Points visible in user profile and checkout
- Redeem points as discount on next order
- **Why:** Drives repeat purchases. Saree buyers return for occasions — give them a reason.

---

### Phase 3 — Unique / Brand-Differentiating (Month 3–4)

#### 2.13 Occasion Filter
- Filter products by: Wedding, Festive, Casual, Office, Gifting
- Tags assigned per product in admin panel
- Shown as horizontal chip filter on the products page
- **Why:** Customers think "I need a saree for a wedding" — not "I need a Banarasi". Aligns the browse experience with intent.

#### 2.14 Drape Style Guide per Product
- Each product has an optional "How to Drape" section
- Short step-by-step text guide (e.g. Nivi, Bengali, Gujarati style)
- Optional YouTube embed field in admin
- **Why:** No Indian e-commerce saree brand does this well. Positions Krittika Style as knowledgeable and premium, not just a catalog.

#### 2.15 Fabric Care Guide
- Per-product care instructions: washing method, storage, ironing temperature
- Displayed as an expandable accordion on product detail page
- Admin enters care details in product form
- **Why:** Premium saree buyers care deeply about maintenance. Builds trust and reduces returns caused by mishandling.

#### 2.16 Custom Blouse Stitching Add-on
- Optional add-on at checkout: "Add blouse stitching — ₹XXX"
- Customer fills measurement form (bust, waist, length, sleeve)
- Measurements stored against the order
- Admin can view and download measurements per order
- **Why:** High average order value driver. Most customers need stitching and currently have to arrange it separately.

#### 2.17 Virtual Styling Session Booking
- Simple booking form: name, phone, preferred date/time slot
- Admin sees bookings in a new "Consultations" panel
- WhatsApp link or Calendly embed as alternative
- **Why:** Personal touch that justifies premium pricing. Builds customer relationships that competitors cannot replicate at scale.

#### 2.18 Bulk / Corporate Gifting Orders
- Dedicated "Corporate Gifting" page with a quantity + customisation form
- Customer specifies quantity, budget per piece, occasion, delivery date
- Triggers an email to admin + auto-reply to customer
- **Why:** Corporate gifting (Diwali, weddings, employee recognition) is a high-value, low-effort revenue channel for a saree brand.

---

### Phase 4 — Technical & Operational (Ongoing)

#### 2.19 WhatsApp Order Notifications
- Order placed and shipment dispatched messages via WhatsApp Business API (Twilio / Interakt)
- **Why:** WhatsApp has ~95% open rate in India versus ~20% for email.

#### 2.20 SEO — Meta Tags per Product
- Dynamic `<title>` and `<meta description>` per product page using `react-helmet`
- Open Graph tags for WhatsApp / social sharing previews
- **Why:** Organic Google traffic is free. Currently every product page has the same generic title.

#### 2.21 Sitemap + robots.txt
- Auto-generated XML sitemap covering all product and category URLs
- **Why:** Required for Google to index product pages. Currently no sitemap exists.

#### 2.22 Image Optimisation on Upload
- Convert uploaded images to WebP on the backend
- Resize to standard dimensions (max 1200px wide)
- **Why:** Unoptimised images slow down the site. Page speed directly affects both SEO ranking and mobile conversion.

#### 2.23 Admin Analytics Dashboard (Upgrade)
- Revenue chart (daily / weekly / monthly)
- Top 5 products by revenue and by units sold
- Order volume trend
- Return rate percentage
- **Why:** Current dashboard is a basic list. These metrics let you make actual business decisions.

#### 2.24 Rate Limiting on Auth Routes
- Block IPs after N failed login attempts within a time window
- Powered by `express-rate-limit`
- **Why:** Currently the login and OTP routes have no brute-force protection.

---

## 3. Priority Summary

| Priority | Feature | Effort | Impact |
|---|---|---|---|
| 1 | Coupon / Promo Codes | Low | High |
| 2 | Email Notifications | Low | High |
| 3 | Occasion Filter | Low | High |
| 4 | Size / Variant Selection | Medium | High |
| 5 | Drape Style Guide | Low | Unique |
| 6 | COD Support | Medium | High |
| 7 | Product Image Gallery | Medium | High |
| 8 | Address Book | Medium | Medium |
| 9 | Custom Blouse Stitching Add-on | Medium | Unique |
| 10 | SEO Meta Tags + Sitemap | Low | High (long-term) |
| 11 | Order Invoice PDF | Low | Medium |
| 12 | Fabric Care Guide | Low | Unique |
| 13 | Loyalty Points | High | Medium |
| 14 | WhatsApp Notifications | Medium | High |
| 15 | Referral / Share Discount | Medium | Medium |
| 16 | Recently Viewed | Low | Medium |
| 17 | Product Recommendations | Medium | Medium |
| 18 | Virtual Styling Session | Low | Unique |
| 19 | Bulk / Corporate Gifting | Low | Unique |
| 20 | Admin Analytics Upgrade | Medium | Medium |
| 21 | Image Optimisation | Medium | Technical |
| 22 | Rate Limiting | Low | Technical |

---

## 4. Top 3 to Start With

1. **Coupon Codes** — highest immediate revenue impact. Approximately 2 days to build end-to-end.
2. **Email Notifications** — order confirmation and shipping updates are expected by every customer. Reduces "where is my order" support load.
3. **Occasion Filter + Drape Style Guide** — together these make Krittika Style feel like a knowledgeable brand rather than a generic catalog. No direct competitor in this segment does it well.

---

*Document maintained by the development team. Update priorities each month based on customer feedback and business metrics.*
