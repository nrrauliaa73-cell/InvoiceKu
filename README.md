# InvoiceKu — starter project

Starter Next.js + TypeScript + Supabase PostgreSQL project prepared for Netlify deployment.

## Included
- Landing page and admin login
- Protected dashboard backed by Supabase queries
- PostgreSQL schema for profiles, customers, products, invoices, invoice items, and payments
- Owner-scoped Row Level Security (RLS)
- Netlify build configuration

## Prerequisites
- Node.js 20+
- A Supabase project
- A GitHub repository
- A Netlify account

## Run locally

```bash
npm install
cp .env.example .env.local
# Fill in the Supabase URL and publishable/anon key in .env.local
npm run dev
```

## Configure Supabase
1. Open the Supabase project's SQL Editor.
2. Run `supabase/schema.sql`.
3. In Authentication > Users, create the first admin user (do not enable public sign-up for this private invoice app).
4. Copy the project URL and publishable/anon key into `.env.local`.
5. The profile row is created by the SQL trigger when an auth user is created.

The anon/publishable key is intended for client use only because RLS is enabled. **Never expose a Supabase service-role/secret key in `NEXT_PUBLIC_*` variables or browser code.**

## Deploy to Netlify
1. Push this folder to a GitHub repository.
2. In Netlify, choose Add new site > Import an existing project and select the repository.
3. Build command: `npm run build`. Let Netlify manage the Next.js adapter; do not set a static publish directory.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` under Site configuration > Environment variables.
5. Deploy, then test login, database reads, and sign-out.
6. Use the generated `*.netlify.app` domain or change the site name in Netlify.

## Current implementation status
The landing page, login, SQL schema, and data-backed dashboard are implemented. CRUD screens for customers/products/invoices/payments, invoice creation API, PDF generation, and automated payment/status synchronization are next implementation steps. Do not treat this starter as a complete production invoicing system until those workflows and authorization rules are implemented and tested.
