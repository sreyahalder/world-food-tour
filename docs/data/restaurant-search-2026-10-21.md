# Restaurant search repair

Mermeta and Mermeta Restaurant both returned an empty Photon response, which the old service cached for 24 hours. NYC DOHMH's current public dataset contains restaurant `50176955`, MERMETA, at 479 73 STREET, Brooklyn, NY 11209, with latitude `40.631334841006` and longitude `-74.022751265493`.

Sources: [official restaurant website](https://mermetaalgerianrestaurant.com/), [NYC DOHMH record](https://data.cityofnewyork.us/resource/43nn-pn8j.json?camis=50176955). The website uses the spelling Marmeta; NYC registers MERMETA. The record's 1900 inspection date is a placeholder for a registered restaurant with no inspection recorded, not a date of operation or a closure. Coordinates are supplied by NYC, not inferred from a neighborhood.

The search now falls back to NYC records when Photon has no valid result or fails. It retains verified provider IDs and original coordinates. Only server-registered listings can be saved. The database accepts exactly matching NYC provider, ID, and source URL combinations alongside existing OSM records. Coordinate bounds, row security and client write restrictions stay enforced. No journal entry is created or modified by this repair.

Search while typing uses a 400 ms debounce, at least 1.2 seconds between requests, cancellation, and stale-response rejection. Selecting a restaurant, clearing the field and closing the editor cancel pending work. The server cache version changed so the previously cached empty Mermeta responses are ignored.

Validation: 12 provider tests and four search lifecycle tests passed, along with TypeScript and the production build. A live provider call for “Mermeta Restaurant” returned the record above. A rolled-back database test accepted that record, rejected a mismatched source and invalid coordinates, and confirmed anonymous and authenticated clients cannot register venues directly. Edge Function version 3 was deployed with JWT verification and owner checks retained. Live browser verification is unavailable in this session.

The security advisor reported no new findings. Its existing [leaked password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains outside this change.

## Belmont branch correction

Searching “Çka Ka Qëllu Belmont” returned the Manhattan OSM listing, so the previous fallback never queried NYC's records. The query also kept accents while NYC registers the restaurant as CKA KA QELLU, and Belmont was absent from the searched address fields.

Search now combines both providers, supports accented input against ASCII registrations, and recognizes Belmont's official 2010 NTA code, BX06. Registry matches lead the results. Duplicate listings retain the existing OSM identity when the normalized name, borough, street number and coordinates agree; different branches remain separate. The server cache is now `venues:v3`, bypassing the incomplete cached results.

Verified Bronx listing: `nyc:dohmh:50072405`, 2321 HUGHES AVENUE, Bronx, NY 10458, latitude `40.853808561184`, longitude `-73.888037810481`. Sources: [NYC restaurant record](https://data.cityofnewyork.us/resource/43nn-pn8j.json?camis=50072405), [official Bronx restaurant page](https://ckakaqellu.com/bronx/), and [NYC's 2010 NTA reference](https://data.cityofnewyork.us/City-Government/2010-Distribution-of-NTA-Size/66tb-g6x5). The verified catalog record includes the official Bronx website. No journal entry was edited.

Validation: all 17 provider tests and four client search tests passed, along with Deno and application type checks. Live provider searches returned Belmont first for both “Çka Ka Qëllu Belmont” and “Cka Ka Qellu Bronx”, both branches once for the unqualified name, and the correct Mermeta listing. Deployed Edge Function version 4 is ACTIVE with JWT verification and owner checks preserved; its deployed files exactly match the tested local files. Live browser verification remains unavailable in this session.
