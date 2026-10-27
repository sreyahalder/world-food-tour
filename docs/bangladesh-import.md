# Bangladesh: Jackson Heights

Imported October 22, 2026 from the user's five supplied photographs and restaurant/dish names. Visit dates and ratings were not provided and remain unset.

## Restaurants

- Fuska House: user-confirmed Jackson Heights visit. The green truck and name are visible in the supplied photo. Saved by name with the location in its notes; no supported verified provider record was found, so no map pin or guessed coordinates were added.
- Premium Sweets & Restaurant: 37-14 73rd Street, Jackson Heights, NY 11372. NYC DOHMH CAMIS 41551354, latitude 40.748332216554, longitude -73.892626068395. Source: https://data.cityofnewyork.us/resource/43nn-pn8j.json?camis=41551354
- Premium's restaurant/menu link: https://www.seamless.com/menu/premium-sweets--restaurants-37-14-73rd-st-queens/5212440 . Listing matches its address and phone. The former official website was not accessible.

## Photos and dishes

Original user JPEGs copied without edits into the public food-tour-photos bucket under imports/bd-jackson-heights/.

- fuska-house.jpeg: Fuska House restaurant photo.
- fuchka.jpeg: Fuchka, identified from the supplied photograph.
- premium-sweets.jpeg: Premium Sweets interior.
- meal.jpeg: Goat biryani, ilish (hilsa), and begun (eggplant). All three dish records use the same URL so they render on one photo card with three stickers.
- mishti-doi.jpeg: Mishti doi.

Five transparent PNG stickers were generated using the user's photos and the existing pixel-art style. Full prompts and source files: [bangladesh-stickers-v1.txt](assets/bangladesh-stickers-v1.txt).

## Multiple restaurants per country

Removed the local-country unique index. Existing entry UUID uniqueness, verified-location rules, owner-only writes, and private archive policies are unchanged. The country page renders both restaurant cards and offers Add restaurant; each existing restaurant retains its own Edit control. Countries already visited remain selectable in the editor.

## Verification

- All five photo URLs returned HTTP 200 with content lengths matching the originals.
- All five stickers are RGBA PNGs with transparent backgrounds and visible subjects.
- Two public Bangladesh restaurant entries, five dishes, five unique photos, three grouped dish cards.
- Typecheck and ten relevant existing tests passed; the saved Bangladesh payload also passed photo-group and sticker-resolution checks.
- Transactional database tests passed for multiple restaurants, entry identity, location validation, owner access, and archive privacy.
- The private Los Angeles Bangladesh entry matches its exact pre-import snapshot.
- Security advisor found no new database issue. Its existing leaked-password protection notice remains unrelated to this import.
- Browser inspection remains unavailable because the browser security service was blocked earlier in this session. No browser workaround was used.

## Saved entry IDs

- Fuska House: `245a8008-efe7-42a5-a310-53aeb2e2e84f`
- Premium Sweets & Restaurant: `7fecdefa-bd5d-49c4-809f-ad2fb3924444`
