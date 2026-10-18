# Alphabet for Two

A public New York City food journal with owner-only editing.

## Data

All country reference content, history, restaurant suggestions, entries, dish objects and uploaded journal photographs live in the existing `world-food-tour` Supabase project (`zyodqqyhapclcxajuoah`). Country shapes and the editorial cover image are versioned presentation assets.

- `countries.profile`: country metadata, attributed history and cuisine guide.
- `restaurant_visits`: existing entries retained; new fields add stable `entry_uuid`, address, coordinates, ratings, photos and `dish_objects`. Existing string dishes remain compatible and are refreshed by the atomic save RPC.
- `food_tour_places`: NYC planning suggestions linked to verified restaurant records.
- `food_tour_restaurants`: canonical named OpenStreetMap food venues, including provider ID, source URL, address, borough, coordinates and verification time. Only the server can register listings.
- `food-tour-places` Edge Function: owner-authenticated restaurant search. Requires a named food POI in the provider’s New York administrative area; excludes street-only matches, non-NYC results, invalid coordinates and disused listings. No per-keystroke autocomplete: searches are explicit, cached for 24 hours, and globally limited to one upstream request per 1.1 seconds.
- `food_tour_private.owners`: verified Supabase Auth user IDs; inaccessible to API roles.
- `food-tour-photos`: public photo bucket; 6 MB per image, JPG/PNG/WebP only. Upload/update/delete require the owner. Removing a photo from an entry removes the reference; stored files are retained to avoid breaking shared links.
- Existing entries are retained with `city`: 56 Los Angeles tour rows and one Solvang row. They are hidden from this website and anonymous reads. All site queries, counters, country stories and maps use New York entries only. The owner can still access the California archive in Supabase.

## Access

Visitors can read without signing in. The **Owner login** button uses the owner's existing Supabase email/password account. Supabase handles session persistence, token refresh, and password recovery. “Forgot password?” requests an email link that opens `/account/recovery`; the owner then enters and confirms a new password. The recovery page checks the user and owner authorization before displaying the password form. Allow `https://alphabet-for-two.haldersreya.chatgpt.site/account/recovery` in Supabase Auth redirect URLs. Dashboard credentials are separate from this application account. There is no public signup or first-visitor ownership claim. Database RLS and Storage policies enforce owner-only mutations independently of hidden UI controls. The public API key in `lib/supabase-config.json` is intentionally safe to distribute; there is no service-role key in the site.

The map search runs inside Supabase and checks both the authenticated user and the owner RPC before using its internal service credentials. No service credentials are exposed in Sites. Legacy free-text geocoding and D1/R2 endpoints are removed. A database trigger fills restaurant name, address, city and coordinates from the selected canonical listing and rejects unvalidated restaurant entries, including direct Data API writes. The NYC save RPC rejects attempts to edit archived entries from other cities.

The owner can add/edit/remove visits, set Visited/About to/No restaurant/Future, upload photos, manage individually identified dish objects, rate meals, and edit country history and attribution. Saves are atomic and idempotent by UUID. The world map counts only Visited New York entries. Dates remain optional; any actual restaurant requires a selected map listing and its coordinates.

## Run locally

This branch contains the full source of [Alphabet for Two](https://alphabet-for-two.haldersreya.chatgpt.site/), exported from published Sites version 6 (source commit `3009a64c6008a8a37cdc481a3e8cd9014c3c4c54`). The older static project remains on `main`.

Requirements: Node.js 24 (or at least 22.13) and pnpm 11.25.0. If you use nvm, run `nvm install` and `nvm use` in this directory. If pnpm is missing, install it with `npm install --global pnpm@11.25.0`.

```bash
git clone --branch alphabet-for-two https://github.com/sreyahalder/world-food-tour.git alphabet-for-two
cd alphabet-for-two
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://localhost:5173**. Country pages also work at paths such as `/country/af`.

The source includes its build plugins and runtime scripts; a ChatGPT or Supabase dashboard login is not required to start the local site. It uses React, TypeScript, Vinext/Vite, and the existing Supabase project. No `.env` file is needed to read the journal: `lib/supabase-config.json` contains only the project's browser-safe publishable key and URL.

Local editing connects to the same live Supabase data. Sign in using your food-journal owner account to upload images or change entries. Saves from localhost also change the public journal. To use a separate development database, change `lib/supabase-config.json` to that project's URL and publishable key, and provision its schema and owner access separately. Never put service-role keys or management tokens in this file.

```bash
pnpm typecheck
pnpm build
```

`pnpm build` produces the Cloudflare Worker build. The checked-in `.openai/hosting.json` retains the existing Sites project identity, and the build tooling is included in this repository. GitHub pushes do not automatically update the hosted ChatGPT Site; its publishing workflow is separate. This branch does not install GitHub Actions or change the old GitHub Pages deployment.

### Password recovery configuration

The password-reset redirect issue is still pending in Supabase. In **Authentication > URL Configuration**, add these exact entries to **Redirect URLs**, preserving any existing cookbook URLs:

```text
https://alphabet-for-two.haldersreya.chatgpt.site/account/recovery
http://localhost:5173/account/recovery
```

The application already sends the current origin plus `/account/recovery`. If its destination is not allowed, Supabase can fall back to the project's existing Site URL, which is why a reset email can open the cookbook app. Request a fresh reset email after saving the settings. If a custom reset email template hardcodes the cookbook URL or `.SiteURL`, use Supabase's `{{ .ConfirmationURL }}` recovery link instead so the supplied redirect is honored. Dashboard credentials are separate from the journal's owner account.

### Backend source

Supabase migrations are in `supabase/migrations/` and the restaurant-validation Edge Function is in `supabase/functions/food-tour-places/`. These migrations document changes already applied to the existing project and assume its original tables exist. Do not reapply them to production or treat them as a complete fresh-database bootstrap.

## Verification

Public reads, authenticated non-owner write denial, owner create/update/delete, nested dish persistence, and history editing are checked with transactional database tests that roll back. Provider tests check valid restaurants and reject non-NYC, street-only, disused and invalid-coordinate results. Transactional database tests verify place validation, canonical coordinates, tamper protection and archive isolation. Browser QA checks the NYC public view and restaurant picker. The owner must enter their own existing password to sign in; no password was read or reset during setup.

## Visual assets

Pixel SVG icons are saved in `public/assets/pixel-icons/` and large restaurant, dish, and history illustrations in `public/assets/placeholders/`. These are explicit placeholders, not documentary photographs. `MediaCover` displays uploaded images with an illustration fallback. The first visit photo becomes its restaurant cover. History images and accessible descriptions are saved in the existing country profile JSON; uploaded files use the owner-protected Supabase photo bucket.
