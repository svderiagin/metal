# METAL STORE

Russian-language metal products catalog and frontend-first online store built with Next.js 16.

## Architecture

The catalog is manually editable TypeScript data, public pages are statically generated where possible, and the cart is
stored in the browser. A small set of Next.js Route Handlers provides the trusted boundary for orders, hosted payments,
webhooks, contact messages, and quotation requests.

See [docs/architecture.md](docs/architecture.md) for catalog editing, deployment, environment variables, and production
requirements.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy `.env.example` to a local environment file only when
integrations are configured. Never commit real secrets.
