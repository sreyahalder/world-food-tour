-- Restaurant websites are editorial metadata, separate from map provenance.
-- Existing RLS keeps these public to read and server-only to change.
alter table public.food_tour_restaurants
 add column website_url text
 constraint restaurant_website_http check(website_url is null or website_url ~ '^https?://[^[:space:]]+$');

comment on column public.food_tour_restaurants.website_url is
 'Verified restaurant website or restaurant-specific ordering page. Never use the map source URL.';

-- Website pages checked against the restaurant names and addresses on 2026-10-21.
update public.food_tour_restaurants r
set website_url=links.url
from (values
 ('https://www.openstreetmap.org/node/5782486184','https://balkhshishkababhouse.currentlvl.com/'),
 ('https://www.openstreetmap.org/node/12662579801','https://order.online/store/ariana-afghan-kebab-restaurant-9th-ave-50031'),
 ('https://www.openstreetmap.org/node/12470628924','https://ckakaqellu.com/new-york/'),
 ('https://www.openstreetmap.org/node/2844921607','https://thekasbahcafe.com/')
) as links(source_url,url)
where r.source_url=links.source_url;
