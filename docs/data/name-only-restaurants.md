# Restaurants saved by name

The visit editor now offers “Closed or unlisted? Add by name” beside restaurant search. It copies the current query into a required name field, cancels pending searches and preserves the rest of the draft. A saved entry without a place ID reopens in this mode. The owner can switch back to search later.

The live save RPC retains the supplied title when no listing is selected. A database trigger clears address, neighborhood, coordinates and source URL for these entries, including direct table writes. Named entries still count as visited when their status is Visited. They do not create a New York map pin, an empty address label or a directions link. Verified venues retain their canonical location validation. Owner authorization, archive restrictions, row security and one entry per country remain intact.

Deployed migration: `20261022011901_name_only_restaurants.sql`. No existing journal records were modified.

Validation: the live transactional checks in `supabase/tests/name_only_restaurants.sql` passed and rolled back their fixture writes. They cover create/edit, title trimming, media and note retention, removal of unverified map fields, transitions between named and verified entries, rejection of blank visited names and unknown listing IDs, country uniqueness, notes-only statuses, and anonymous/non-owner write denial. Thirteen existing location, suggestion and search tests passed. TypeScript, the production build and whitespace checks passed. Live browser verification remains unavailable in this session.

The security advisor reported no new findings. The existing [leaked password protection setting](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) was unchanged.
