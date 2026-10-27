-- Accept official NYC restaurant records while preserving server-only registration,
-- NYC coordinate bounds, existing OSM IDs, and all owner/write policies.
alter table public.food_tour_restaurants
 drop constraint food_tour_restaurants_id_check,
 drop constraint food_tour_restaurants_provider_check,
 drop constraint food_tour_restaurants_source_url_check,
 add constraint food_tour_restaurants_provider_source_check check (
  (provider='openstreetmap'
   and id ~ '^osm:(node|way|relation):[0-9]+$'
   and source_url='https://www.openstreetmap.org/'||split_part(id,':',2)||'/'||split_part(id,':',3))
  or
  (provider='nyc-dohmh'
   and id ~ '^nyc:dohmh:[0-9]{8}$'
   and source_url='https://data.cityofnewyork.us/resource/43nn-pn8j.json?camis='||split_part(id,':',3))
 );
