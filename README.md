# JK Curryhouse — The Real Indian Kitchen

Full-stack restaurant website for JK Curryhouse, Chippenham (SN15 1HA).

## Tech Stack
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** AWS RDS PostgreSQL (via Prisma ORM)
- **Auth:** AWS Cognito (Phase 2)
- **Payments:** Stripe (Phase 4)
- **Email:** AWS SES (Phase 3+)
- **Storage:** AWS S3 (Phase 6)
- **Hosting:** AWS Amplify
- **CDN:** AWS CloudFront
- **DNS:** AWS Route 53

## Development Setup

```bash
npm install                 # also generates the Prisma client
cp .env.local.example .env.local
# Fill in .env.local — DATABASE_URL points at AWS RDS (see docs/DATABASE_SETUP.md)

npx prisma db push          # create / update tables
npx prisma db seed          # load the launch menu + default settings (safe to re-run)
npm run dev
```

## Admin Panel (`/admin`)

Sign in with a Cognito user in the **Admins** group. Every admin API call is verified on the
server (token signature + group), and every change is written to an activity log.

| Section | What staff can do |
|---|---|
| **Dashboard** | Today's revenue, active orders, tonight's bookings & covers, live offers, on/off switches for ordering / delivery / booking, recent admin activity |
| **Menu** | Add, edit, hide (sold out) and delete dishes; set Today's Specials; allergens, vegan/vegetarian/spicy/chef's pick; upload photos to S3. Changes appear on `/`, `/menu` and `/order` immediately |
| **Orders** | Live board (auto-refresh), move orders through Confirmed → Preparing → Ready → Delivered, cancel with automatic Stripe refund |
| **Reservations** | Take phone & walk-in bookings, edit / move bookings, assign tables, staff notes, seat / complete / no-show, cancel with optional guest email, CSV export, capacity override |
| **Offers** | Codes for everyone or for loyal account holders (unlock after N orders / £ spend), schedule start & end, minimum basket, usage cap, pause / resume, **Roll out** to qualifying customers with optional email (with unsubscribe link) |
| **Customers** | Everyone who has ordered or booked, merged by email, with spend, visits and no-shows; CSV export; GDPR erasure |
| **Settings** | Ordering, delivery & booking switches; delivery fee, free-delivery threshold, minimum order, postcode areas; bookings & guests per slot, max party size; closed dates; website notice banner |

Prices, delivery fees and discount codes are always re-calculated on the server when an order is
placed, and payment is verified with Stripe before an order is confirmed.

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
  page.tsx              # Homepage
  menu/page.tsx         # Full menu page
  reservations/         # Phase 3
  order/                # Phase 4
  offers/               # Phase 5
  allergens/            # Allergen info
  privacy/              # Privacy policy
components/
  layout/               # Navbar, Footer
  home/                 # Hero, About, OpeningHours, etc.
  menu/                 # MenuClient (filtered menu)
  admin/                # Admin panel screens
  api/admin/            # Admin-only API (all routes call requireAdmin)
lib/
  menu-data.ts          # Launch menu (seed source + offline fallback) + allergens
  server-auth.ts        # Cognito JWT verification, requireAdmin, audit log
  api-client.ts         # authFetch — attaches the signed-in user's token
  menu-repo.ts / booking.ts / offer-rules.ts / orders.ts / settings.ts  # server logic
  utils.ts              # Helpers
prisma/
  schema.prisma         # Full DB schema
  seed.ts               # Loads menu + default settings
infra/
  rds-postgres.yaml     # CloudFormation: RDS PostgreSQL in ap-southeast-2 (Sydney)
docs/
  DATABASE_SETUP.md     # Step-by-step AWS database + admin setup
```

## Build Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation — Homepage + Menu | ✅ Done |
| 2 | Authentication (AWS Cognito) | 🔜 Week 3 |
| 3 | Reservations | 🔜 Week 4 |
| 4 | Online Ordering + Stripe | 🔜 Week 5-6 |
| 5 | Offers & Personalisation | 🔜 Week 7 |
| 6 | Admin Panel | ✅ Done |
| 7 | Polish & GDPR Compliance | 🔜 Week 9 |
| 8 | Testing & Launch | 🔜 Week 10 |

## Deployment (AWS Amplify)

1. Push to GitHub
2. Connect repo in AWS Amplify Console
3. Set environment variables in Amplify
4. Amplify auto-builds on every push to `main`

See `amplify.yml` for the build config.
