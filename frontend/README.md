# ShareNest frontend

ShareNest is a community donation app built with React, Vite, and Supabase.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and either `VITE_SUPABASE_ANON_KEY` or `VITE_SUPABASE_PUBLISHABLE_KEY` to values from the same Supabase project. Use a public key only; never use a service-role or secret key in a frontend app.
4. Start the development server with `npm run dev`.

The app requires a configured Supabase project to load donations and authenticate users. If configuration is missing, it displays setup instructions instead of a blank page. Restart the Vite server after changing environment variables.

## Checks

- `npm run lint`
- `npm run build`
