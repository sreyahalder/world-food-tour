# Vercel deployment

Production: https://world.sreyahalder.com

Vercel project: `world-food-tour` in `sreya-halders-projects`.

## Publish an update

Run from this application directory after checking the changes:

```sh
npm exec --yes --package=vercel -- vercel deploy --prod --yes
```

The local `.vercel/project.json` links this directory to the project. On a fresh checkout, run `vercel link --scope sreya-halders-projects --project world-food-tour` first.

`vercel.json` builds the app with standard Next.js and pins pnpm 11.25.0. Local development continues to use Vinext on port 5173. `.vercelignore` uploads application source and public assets, excluding credentials, generated build directories, local runtime state, and trial fonts.

Deployments use the working files in this directory. Automatic Git deployments are disconnected because the repository's `main` branch contains the older static food tour. Do not reconnect it to `main`; configure the current application branch and commit its changes before enabling automatic deployment.

## Domain

Squarespace manages DNS for `sreyahalder.com`. The new record is:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| CNAME | world | 9899c1b855f1525c.vercel-dns-016.com | 4 hours |

Vercel verifies the domain and provisions HTTPS. The existing root, www, food, closet, and verification records were left unchanged.

## Data and sign-in

The site uses the existing Supabase project `zyodqqyhapclcxajuoah`; no data migration or new application secrets are required. The public configuration in `lib/supabase-config.json` is safe to bundle.

Supabase Auth Site URL is `https://world.sreyahalder.com`. The redirect allowlist includes `https://world.sreyahalder.com/account/recovery`. Existing redirect entries were preserved. Owner email/password sign-in remains unchanged.

## Initial release

Published October 22, 2026. Production deployment: `dpl_5TBJdh2zZJmHKsnw5gjL5tPUep6t`. Native Next.js production build and TypeScript checks passed. The custom domain returned HTTP 200 over HTTPS and loaded the public journal from Supabase.
