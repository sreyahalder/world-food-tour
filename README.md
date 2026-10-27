# Alphabet City

A public New York City food journal with owner-only editing.

Live at **[world.sreyahalder.com](https://world.sreyahalder.com)**, hosted on Vercel. See [deployment notes](docs/vercel-deployment.md) for publishing updates.

## Data

All country reference content, history, restaurant suggestions, entries, dish objects and uploaded journal photographs live in the existing `world-food-tour` Supabase project (`zyodqqyhapclcxajuoah`). Country shapes and the editorial cover image are versioned presentation assets.

- `countries.profile`: country metadata, attributed history and cuisine guide.
- `restaurant_visits`: existing entries retained; new fields add stable `entry_uuid`, address, coordinates, ratings, photos and `dish_objects`. Existing string dishes remain compatible and are refreshed by the atomic save RPC.
- `food_tour_places`: NYC planning suggestions linked to verified restaurant records.
- `food_tour_restaurants`: canonical named OpenStreetMap food venues and official NYC DOHMH restaurant records, including provider ID, source URL, address, borough, coordinates and verification time. The separate `website_url` stores a checked restaurant website or restaurant-specific ordering page for the Restaurant button. Provenance stays in `source_url`. Only the server can register listings; each source URL must match its provider and venue ID.
- `food-tour-places` Edge Function: owner-authenticated restaurant search using [Photon](https://github.com/komoot/photon) OpenStreetMap data, with [NYC Open Data restaurant records](https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j) combined with map results to include missing branches and survive provider outages. Named NYC food venues only; excludes street-only matches, non-NYC results, invalid coordinates and known closed listings. Typing at least three characters starts a search after 400 ms, with requests spaced at least 1.2 seconds apart, cancellation on edits/selection/close, and stale-response protection. Enter or Search retries immediately subject to that spacing. Server results are cached for 24 hours under `venues:v3` and globally limited to one search per 1.1 seconds. The client caches successful queries for one minute and empty queries for ten seconds; explicit retries bypass that cache. Photon permits moderate project use with no availability guarantee. Set the server-only `FOOD_TOUR_PHOTON_URL` to use another Photon instance. Provider failures log status codes without search text or credentials.
- `food_tour_private.owners`: verified Supabase Auth user IDs; inaccessible to API roles.
- `food-tour-photos`: public photo bucket; 6 MB per image, JPG/PNG/WebP only. Upload/update/delete require the owner. Removing a photo from an entry removes the reference; stored files are retained to avoid breaking shared links.
- Existing entries are retained with `city`: 56 Los Angeles tour rows and one Solvang row. They are hidden from this website and anonymous reads. All site queries, counters, country stories and maps use New York entries only. The owner can still access the California archive in Supabase.

## Access

Visitors can read without signing in. The **Owner login** button uses the owner's existing Supabase email/password account. Supabase handles session persistence, token refresh, and password recovery. “Forgot password?” requests an email link that opens `/account/recovery`; the owner then enters and confirms a new password. The recovery page checks the user and owner authorization before displaying the password form. Allow `https://alphabet-for-two.haldersreya.chatgpt.site/account/recovery` in Supabase Auth redirect URLs. Dashboard credentials are separate from this application account. There is no public signup or first-visitor ownership claim. Database RLS and Storage policies enforce owner-only mutations independently of hidden UI controls. The public API key in `lib/supabase-config.json` is intentionally safe to distribute; there is no service-role key in the site.

The map search runs inside Supabase and checks both the authenticated user and the owner RPC before using its internal service credentials. No service credentials are exposed in Sites. Legacy free-text geocoding and D1/R2 endpoints are removed. A database trigger fills restaurant name, address, city and coordinates from a selected canonical listing. Closed or unlisted restaurants can instead be saved by name, with no place ID. The trigger clears all address, coordinate, and map-link fields on those entries, including direct Data API writes. The NYC save RPC rejects attempts to edit archived entries from other cities.

Each country has one New York journal entry. Saving a place replaces that country’s planning suggestion on its page and the New York map. Existing countries open their saved entry for editing, and a partial unique index prevents duplicate entries without affecting the California archive.

The owner can add/edit/remove visits, set Visited/About to/No restaurant/Future, upload photos, manage individually identified dish objects, rate meals, and edit country history and attribution. Saves are atomic and idempotent by UUID. The world map counts only Visited New York entries. Dates are not shown or collected in the interface; previously saved dates are retained. The editor offers “Closed or unlisted? Add by name” for memories without a current map listing. These entries keep their title, status, notes, photos and dishes, but do not get a map pin or directions link. Existing name-only entries reopen in that mode; switching back to search retains the title as the query.

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

Restaurant search runs in the deployed Edge Function, including when the frontend runs locally. Changes to `supabase/functions/food-tour-places/` must be deployed to that function to take effect. Provider regression tests run with `deno test --config supabase/functions/food-tour-places/deno.json supabase/functions/food-tour-places/provider_test.ts`.

## Verification

Run `node --experimental-strip-types --test tests/country-places.test.mjs` to check that saved entries replace suggestions by country on both the country page and map.

Public reads, authenticated non-owner write denial, owner create/update/delete, nested dish persistence, and history editing are checked with transactional database tests that roll back. Provider tests check valid restaurants and reject non-NYC, street-only, disused and invalid-coordinate results. Transactional database tests verify place validation, canonical coordinates, tamper protection and archive isolation. Browser QA checks the NYC public view and restaurant picker. The owner must enter their own existing password to sign in; no password was read or reset during setup.

## Visual assets

The interface uses Bricolage Grotesque for headings and DM Sans for body text, navigation, and controls. Variable WOFF2 files, including extended Latin accents and DM Sans italics, are bundled under `public/fonts/`. `app/fonts.css` declares each subset and the layout preloads the two regular Latin files. Both fonts include their SIL Open Font License files beside the assets. Fonts are served locally, with no runtime Google Fonts requests.

Pixel SVG icons are saved in `public/assets/pixel-icons/` and large restaurant, dish, and history illustrations in `public/assets/placeholders/`. These are explicit placeholders, not documentary photographs. `MediaCover` displays uploaded images with an illustration fallback. The first visit photo becomes its restaurant cover. Country history is text-only, with editable source links and attribution. Uploaded restaurant and dish photos use the owner-protected Supabase photo bucket.

Dish photos carry transparent food stickers partly overlapping their top-left corner. The original generated RGBA atlas is `public/assets/dish-stickers/dish-sprites-v2.png`. Eleven illustrations cover the guide dishes and uploaded NYC meals, including the Albanian mixed grill and soup. `lib/dish-sprite-atlas.ts` holds measured crop coordinates. The renderer crops each item at its original resolution and transparency, then uses normal browser scaling to fit a 64-pixel sticker. No additional pixelation, alpha threshold, or badge backing is applied. Name matching handles accents and the journal’s “Manto” spelling. Legacy SVG references resolve to the new artwork.

The merguez sandwich uses a separate transparent illustration at `public/assets/dish-stickers/merguez-sandwich-v2.png`, redrawn with chunkier pixel shapes to match the owner's food-icon reference. It renders directly at full source detail with the same corner placement and tilt. “Merguez sandwich,” “Sandwich aux merguez,” and “Merguez” select it automatically; older v1 references also resolve to v2. Generation details and the prompt are in `docs/assets/merguez-sandwich-v2.txt`.

On upload, a recognized dish automatically uses its illustrated sprite. A dish outside the illustrated set uses a transparent empty-plate placeholder until a matching illustration is added. Photo-to-pixel badge conversion is retired. The atlas URL and sprite key, or standalone illustration URL, are saved in each dish’s `sticker` field. This uses the existing save RPC and owner-protected upload flow.

Run `node --experimental-strip-types --test tests/dish-stickers.test.mjs` to verify all dish matches, legacy references, RGBA asset coverage, and crop boundaries. `docs/assets/dish-sprites-v2.txt` records the generation prompt and rendering details. The previous SVG icons and their generator remain available as v1 references.

### Playable characters

Both characters appear across the maps, journal, and country pages. WASD moves Sreya; the arrow keys move her boyfriend. They can move simultaneously in four directions, with diagonal movement at the same speed. Drag either character with a mouse or touch to place them anywhere within the screen. They dangle while held, then breathe and blink when released, using separate sprite frames for each direction. Dragging keeps the character under the original grab point and temporarily takes priority over that character's walking keys. There is no bottom control bar. Typing keeps its normal keyboard behavior, and editing or opening a photo hides and suspends the characters. Reduced motion uses static idle and held poses.

The saved RGBA sprite sheet and its measured frame coordinates live in `public/assets/sprites/couple-v2.png` and `couple-v2.json`. The combined atlas contains the original 24 walking poses plus 30 new drag and idle poses. Original walking and action source sheets remain saved separately. Frames render on a 48 × 64 pixel canvas at 2× scale, with a shared foot anchor at (24, 60), per-frame size normalization, and transparent pixel edges. `docs/assets/couple-v2-rendered.png` shows all 54 poses from the runtime renderer; `docs/assets/couple-v2.txt` records the generation prompt and asset details. Run `node --experimental-strip-types --test tests/couple-motion.test.mjs` to check independent controls, speed, bounds, drag offsets, release behavior, animation states, input handling, and atlas coverage.
