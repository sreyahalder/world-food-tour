# NYC restaurant location verification

Verified on October 21, 2026 against the live OpenStreetMap API and the three restaurants' official websites. The three displayed locations already matched their named OSM venue nodes at full precision. No latitude or longitude was guessed or moved to a street, ZIP code, or borough centroid.

| Restaurant | Latitude | Longitude | Official street address | Coordinate source |
| --- | --- | --- | --- | --- |
| [Balkh Shish Kabab House](https://balkhshishkababhouse.currentlvl.com/) | 40.7742036 | -73.9133194 | 23-10 31st Street, Queens, NY 11105 | [OSM node 5782486184](https://www.openstreetmap.org/node/5782486184) |
| [Çka Ka Qëllu, New York](https://ckakaqellu.com/new-york/) | 40.7446861 | -73.9818352 | 118 East 31st Street, New York, NY 10016 | [OSM node 12470628924](https://www.openstreetmap.org/node/12470628924) |
| [Kasbah Cafe](https://thekasbahcafe.com/) | 40.7389693 | -73.9266383 | 39-19 Greenpoint Avenue, Queens, NY 11104 | [OSM node 2844921607](https://www.openstreetmap.org/node/2844921607) |

API evidence: `https://api.openstreetmap.org/api/0.6/nodes.json?nodes=5782486184,12470628924,2844921607,12662579801`. The hidden Ariana planning suggestion was also checked and still matches its OSM node; the saved Afghanistan visit continues to replace it on the map.

## Changes

- Read saved visits' coordinates and address from the joined canonical restaurant record, so later location corrections are not hidden by an old visit snapshot. The database-validated RPC snapshot remains a fallback immediately after saving.
- Preserve the complete numeric latitude/longitude pair. Skip invalid, missing, swapped, or non-NYC coordinates before creating map layers.
- Use the same latitude/longitude for the fixed ground dot and the photo marker. Leaflet's `[32,74]` icon anchor matches the photo pin's bottom tip. Hover changes colors and shadow only, with no position offset.
- Show the street address in the compact popup. The full address is available as the address line's title.
- Correct Balkh's stored address from ZIP 11101 to 11105 and use Astoria, as reported by its official website. Refresh the verification timestamps for the three displayed restaurants. A guarded database update confirmed that notes, photos, dishes, ratings, dates, and other journal content were unchanged.

These are venue coordinates verified against the named map listings, not a survey of individual entrance doors. No door-level survey precision is claimed. The browser cannot be inspected in this session; verification covers source data, canonical readback, coordinate tests, and the application build.
