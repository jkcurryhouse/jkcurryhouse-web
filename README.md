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
npm install
cp .env.local.example .env.local
# Fill in .env.local with your values

npm run dev
```

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
lib/
  menu-data.ts          # Static menu data + allergens
  utils.ts              # Helpers
prisma/
  schema.prisma         # Full DB schema
```

## Build Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Foundation — Homepage + Menu | ✅ Done |
| 2 | Authentication (AWS Cognito) | 🔜 Week 3 |
| 3 | Reservations | 🔜 Week 4 |
| 4 | Online Ordering + Stripe | 🔜 Week 5-6 |
| 5 | Offers & Personalisation | 🔜 Week 7 |
| 6 | Admin Panel | 🔜 Week 8 |
| 7 | Polish & GDPR Compliance | 🔜 Week 9 |
| 8 | Testing & Launch | 🔜 Week 10 |

## Deployment (AWS Amplify)

1. Push to GitHub
2. Connect repo in AWS Amplify Console
3. Set environment variables in Amplify
4. Amplify auto-builds on every push to `main`

See `amplify.yml` for the build config.
