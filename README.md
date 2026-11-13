# Trendify: MERN E-Commerce (Meesho / Flipkart style) with Redis + Kafka

Storefront (`frontend/`), admin panel (`admin/`) and API (`backend/`).

## What's new in this version

**Storefront**
- Marketplace UI: sticky header with live search suggestions, category strip, mobile bottom tab bar, hero carousel
- **🔥 Trending Now** (home section + `/trending` page, per-category tabs, rank badges, LIVE indicator)
- Shop by Category grid, Deals of the Day (countdown), New Arrivals, Best Sellers, Recently Viewed, Similar Products
- Product cards with MRP / % off, green rating pill, wishlist heart, "only N left" urgency
- Collection page: server-side filters (category, sub-category, price, rating, discount), 6 sort options, Load more
- Real login / signup, server-synced cart (guest cart merges on login), wishlist, reviews with "Verified purchase"
- Checkout with Indian address validation: **COD, Razorpay (UPI/cards), Stripe**; real orders page with status tracker + cancel
- Prices in ₹, free delivery above a threshold (configurable)

**Admin**
- Dashboard: revenue, today's orders, order status, low stock, top sellers, **live trending ranking**
- Categories (with sub-categories + emoji icon + photo), Banners, Product add with MRP/stock/brand/tags,
  inline editing of price/MRP/stock, "Boost in trending", visibility toggle, working Orders page with status updates

**Backend**
- Redis: cache-aside for product lists / categories / banners / suggestions, trending sorted sets, event de-duplication
- Kafka: user behaviour events → consumer → Redis trending + MongoDB counters
- Server-side price + stock validation, atomic stock reservation (no overselling), verified Stripe/Razorpay payments
- helmet, compression, rate limiting, admin JWT with role + expiry, image uploads to Cloudinary

## How "Trending Now" works

```
browser (view / add to cart / wishlist)  ──►  POST /api/product/track  (de-duplicated per visitor, via Redis SET NX)
order placed / paid                       ──►  purchase event (server-side)
                                                   │
                                            Kafka topic  shop.events  (key = productId)
                                                   │
                                  consumer (embedded, or `npm run worker`)
                                       ├─ Redis: ZINCRBY on the current hourly bucket  (view 1, wishlist 3, cart 5, purchase 10)
                                       └─ MongoDB: batched $inc on views / cartAdds / sold / popularity
                                                   │
GET /api/product/trending ── blends the last 24 hourly buckets with 0.92^hours decay, cached 60s
```
If Kafka isn't configured or is down, events are processed in-process; if Redis isn't configured, an in-memory
fallback is used. So the project always runs, and production just needs the env vars.

## Quick start

```bash
# 1. infrastructure (Mongo + Redis + Kafka + Kafka UI on :8080)
docker compose up -d

# 2. backend
cd backend
cp .env.example .env        # fill JWT_SECRET, ADMIN_*, Cloudinary (needed only for uploading new images)
npm install
npm run seed                # categories + your 52 original products + demo products for new categories
npm run server              # http://localhost:4000

# 3. storefront
cd ../frontend && cp .env.example .env && npm install && npm run dev      # http://localhost:5173

# 4. admin
cd ../admin && cp .env.example .env && npm install && npm run dev         # http://localhost:5174
```
No Docker? Leave `REDIS_URL` and `KAFKA_BROKERS` empty in `backend/.env`. Only MongoDB is required.

Check it: `GET http://localhost:4000/` shows whether cache is `redis` or `memory` and Kafka is `enabled` or `in-process`.
Open a few products, add to cart, then reload the home page: the Trending Now order changes within ~1 minute.

## Production notes
- **Vercel is fine for the API's request handling, but not for the Kafka consumer** (it must be a long-running process).
  Set `KAFKA_EMBEDDED_CONSUMER=false` and run `npm run worker` on Render/Railway/EC2.
- Use managed Redis (Upstash / Redis Cloud) and managed Kafka (Upstash / Confluent / MSK); set `KAFKA_SSL`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`.
- Seed images are served from `backend/public/seed`; in production upload real images from the admin panel.
- Demo products for new categories use placeholder photos (picsum.photos). Replace them in admin.
- Search uses regex matching, which is fine for thousands of products. Move to Atlas Search / Elasticsearch beyond that.
- Not included yet: coupons, returns workflow, email/SMS notifications, pincode serviceability, seller accounts.
