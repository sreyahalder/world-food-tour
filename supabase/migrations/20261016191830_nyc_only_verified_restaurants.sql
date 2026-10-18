-- Preserve the former California tour while making the public journal NYC-only.
alter table public.restaurant_visits add column city text;
update public.restaurant_visits set city=case when neighborhood='Solvang, CA' then 'Solvang' else 'Los Angeles' end where city is null;
alter table public.restaurant_visits alter column city set default 'New York',alter column city set not null;
alter table public.restaurant_visits add constraint restaurant_city_not_blank check(length(trim(city))>0);
create index restaurant_visits_city_status_date_idx on public.restaurant_visits(city,status,visit_date desc);
create index restaurant_visits_city_country_idx on public.restaurant_visits(city,country_id);
create table public.food_tour_restaurants (
 id text primary key check(id ~ '^osm:(node|way|relation):[0-9]+$'),
 provider text not null check(provider='openstreetmap'),
 name text not null check(length(trim(name))>0),
 address text not null check(length(trim(address))>0),
 city text not null check(city='New York'),
 borough text not null check(borough in ('Manhattan','Brooklyn','Queens','Bronx','Staten Island')),
 latitude double precision not null check(latitude between 40.49 and 40.93),
 longitude double precision not null check(longitude between -74.26 and -73.69),
 source_url text not null check(source_url ~ '^https://www.openstreetmap.org/(node|way|relation)/[0-9]+$'),
 category text not null check(category in ('restaurant','cafe','fast_food','food_court','ice_cream')),
 verified_at timestamptz not null,
 active boolean not null default true
);
alter table public.food_tour_restaurants enable row level security;
revoke all on public.food_tour_restaurants from public,anon,authenticated;
grant select on public.food_tour_restaurants to anon,authenticated;
grant all on public.food_tour_restaurants to service_role;
create policy verified_restaurants_read on public.food_tour_restaurants for select to anon,authenticated using(true);
create table public.food_tour_geocoder_cache(query text primary key,results jsonb not null,expires_at timestamptz not null);
alter table public.food_tour_geocoder_cache enable row level security;
revoke all on public.food_tour_geocoder_cache from public,anon,authenticated;
grant all on public.food_tour_geocoder_cache to service_role;
create policy geocoder_cache_no_client_access on public.food_tour_geocoder_cache for all to anon,authenticated using(false) with check(false);
create table food_tour_private.geocoder_rate_limit(id boolean primary key default true check(id),next_request_at timestamptz not null default now());
insert into food_tour_private.geocoder_rate_limit(id) values(true);
alter table food_tour_private.geocoder_rate_limit enable row level security;
revoke all on food_tour_private.geocoder_rate_limit from public,anon,authenticated;
grant usage on schema food_tour_private to service_role;
grant select,update on food_tour_private.geocoder_rate_limit to service_role;
create policy geocoder_rate_no_client_access on food_tour_private.geocoder_rate_limit for all to anon,authenticated using(false) with check(false);
create function public.food_tour_reserve_geocode() returns boolean language sql security invoker set search_path='' as $$
 with reserved as (update food_tour_private.geocoder_rate_limit set next_request_at=clock_timestamp()+interval '1.1 seconds' where id=true and next_request_at<=clock_timestamp() returning id) select exists(select 1 from reserved)
$$;
revoke all on function public.food_tour_reserve_geocode() from public,anon,authenticated;
grant execute on function public.food_tour_reserve_geocode() to service_role;
alter table public.restaurant_visits add column restaurant_place_id text references public.food_tour_restaurants(id),add column map_url text;
create index restaurant_visits_place_idx on public.restaurant_visits(restaurant_place_id);
alter table public.food_tour_places add column city text not null default 'New York',add column restaurant_place_id text references public.food_tour_restaurants(id);
create index food_tour_places_place_idx on public.food_tour_places(restaurant_place_id);
alter policy tour_visits_read on public.restaurant_visits using(city='New York' or (select food_tour_private.is_owner()));
-- A BEFORE trigger prevents bypassing place validation with direct Data API writes.
create function public.food_tour_validate_location() returns trigger language plpgsql security invoker set search_path='' as $$
 declare place public.food_tour_restaurants;
 begin
 if new.city='New York' then
   if new.restaurant_place_id is null then
     if length(trim(coalesce(new.restaurant_name,'')))>0 or new.status in ('Visited','About to') then raise exception 'Select a verified New York restaurant from the map results' using errcode='23514'; end if;
     new.restaurant_name:='';new.address:='';new.latitude:=null;new.longitude:=null;new.neighborhood:='';new.map_url:=null;
   else
     select * into place from public.food_tour_restaurants where id=new.restaurant_place_id and active=true;
     if not found then raise exception 'This restaurant is not a validated New York map listing' using errcode='23514'; end if;
     new.restaurant_name:=place.name;new.address:=place.address;new.latitude:=place.latitude;new.longitude:=place.longitude;new.neighborhood:=place.borough;new.map_url:=place.source_url;
   end if;
 elsif new.restaurant_place_id is not null then raise exception 'The selected restaurant belongs to New York' using errcode='23514';
 end if;
 return new;
 end $$;
revoke all on function public.food_tour_validate_location() from public;
create trigger food_tour_validated_location before insert or update on public.restaurant_visits for each row execute function public.food_tour_validate_location();
alter table public.restaurant_visits add constraint nyc_restaurant_requires_listing check(city<>'New York' or (restaurant_place_id is not null and latitude is not null and longitude is not null) or (length(trim(coalesce(restaurant_name,'')))=0 and status in ('Future','No restaurant')));
create or replace function public.food_tour_save_visit(entry jsonb) returns public.restaurant_visits language plpgsql security invoker set search_path='' as $$
 declare cid integer; result public.restaurant_visits;
 begin
 if not food_tour_private.is_owner() then raise exception 'Only the journal owner can edit entries' using errcode='42501'; end if;
 if exists(select 1 from public.restaurant_visits where entry_uuid=(entry->>'id')::uuid and city<>'New York') then raise exception 'This website only edits New York entries'; end if;
 if coalesce(entry->>'city','New York')<>'New York' then raise exception 'This journal is for New York only'; end if;
 select id into cid from public.countries where iso_code=entry->>'country';if cid is null then raise exception 'Choose a valid country'; end if;
 if coalesce(entry->>'status','') not in ('Visited','About to','No restaurant','Future') then raise exception 'Choose a valid status'; end if;
 if jsonb_typeof(entry->'dishes') is distinct from 'array' or jsonb_array_length(entry->'dishes')>100 then raise exception 'Invalid dishes'; end if;
 if exists(select 1 from jsonb_array_elements(entry->'dishes') d where jsonb_typeof(d)<>'object' or length(trim(coalesce(d->>'name','')))=0 or coalesce((d->>'rating')::int,-1) not between 0 and 5) then raise exception 'Each dish needs a name and a rating from 0 to 5'; end if;
 if nullif(entry->>'placeId','') is null and (length(trim(coalesce(entry->>'restaurant','')))>0 or entry->>'status' in ('Visited','About to')) then raise exception 'Select a verified New York restaurant from the map results'; end if;
 insert into public.restaurant_visits(entry_uuid,country_id,city,restaurant_place_id,restaurant_name,neighborhood,visit_date,status,notes,dishes,address,latitude,longitude,rating,photos,dish_objects)
 values((entry->>'id')::uuid,cid,'New York',nullif(entry->>'placeId',''),'',null,nullif(entry->>'date','')::date,entry->>'status',entry->>'review',coalesce((select jsonb_agg(d->>'name') from jsonb_array_elements(entry->'dishes') d),'[]'),' ',null,null,(entry->>'rating')::smallint,entry->'photos',entry->'dishes')
 on conflict(entry_uuid) do update set country_id=excluded.country_id,city=excluded.city,restaurant_place_id=excluded.restaurant_place_id,restaurant_name=excluded.restaurant_name,neighborhood=excluded.neighborhood,visit_date=excluded.visit_date,status=excluded.status,notes=excluded.notes,dishes=excluded.dishes,address=excluded.address,latitude=excluded.latitude,longitude=excluded.longitude,map_url=excluded.map_url,rating=excluded.rating,photos=excluded.photos,dish_objects=excluded.dish_objects,updated_at=now()
 returning * into result;
 return result;
 end $$;
revoke all on function public.food_tour_save_visit(jsonb) from public;
grant execute on function public.food_tour_save_visit(jsonb) to authenticated;
insert into public.food_tour_restaurants select * from jsonb_populate_recordset(null::public.food_tour_restaurants,'[{"id":"osm:node:12662579801","provider":"openstreetmap","name":"Ariana Afghan Kebab","address":"9th Avenue, Hell''s Kitchen, Manhattan, New York, NY, 10019","city":"New York","borough":"Manhattan","latitude":40.7651093,"longitude":-73.988016,"source_url":"https://www.openstreetmap.org/node/12662579801","category":"restaurant","verified_at":"2026-10-16T19:22:31.282Z","active":true},{"id":"osm:node:12470628924","provider":"openstreetmap","name":"Çka ka Qellue","address":"118 East 31st Street, Rose Hill, Manhattan, New York, NY, 10016","city":"New York","borough":"Manhattan","latitude":40.7446861,"longitude":-73.9818352,"source_url":"https://www.openstreetmap.org/node/12470628924","category":"restaurant","verified_at":"2026-10-16T19:22:31.283Z","active":true},{"id":"osm:node:2844921607","provider":"openstreetmap","name":"Kasbah Cafe","address":"39-19 Greenpoint Avenue, Queens, New York, NY, 11104","city":"New York","borough":"Queens","latitude":40.7389693,"longitude":-73.9266383,"source_url":"https://www.openstreetmap.org/node/2844921607","category":"restaurant","verified_at":"2026-10-16T19:22:31.283Z","active":true}]'::jsonb);
update public.food_tour_places set restaurant_place_id='osm:node:12662579801',city='New York' where id='ariana';
update public.food_tour_places set restaurant_place_id='osm:node:12470628924',city='New York' where id='cka';
update public.food_tour_places set restaurant_place_id='osm:node:2844921607',city='New York' where id='kasbah';
update public.food_tour_places p set data=p.data||jsonb_build_object('name',r.name,'address',r.address,'area',r.borough,'lat',r.latitude,'lng',r.longitude,'city',r.city,'placeId',r.id,'sourceUrl',r.source_url) from public.food_tour_restaurants r where p.restaurant_place_id=r.id;
