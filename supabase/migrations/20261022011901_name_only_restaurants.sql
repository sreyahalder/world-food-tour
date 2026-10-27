-- Preserve memories of closed or unlisted restaurants without inventing a map location.
-- A null place ID plus a nonempty restaurant name represents a name-only entry.
create or replace function public.food_tour_validate_location()
returns trigger language plpgsql security invoker set search_path='' as $$
declare place public.food_tour_restaurants;
begin
  if new.city='New York' then
    if new.restaurant_place_id is null then
      new.restaurant_name:=trim(coalesce(new.restaurant_name,''));
      if new.restaurant_name='' and new.status in ('Visited','About to') then
        raise exception 'Enter a restaurant name or select a New York map listing' using errcode='23514';
      end if;
      -- Direct writes cannot attach unverified coordinates or source links to a name.
      new.address:=''; new.latitude:=null; new.longitude:=null;
      new.neighborhood:=''; new.map_url:=null;
    else
      select * into place from public.food_tour_restaurants
      where id=new.restaurant_place_id and active=true;
      if not found then
        raise exception 'This restaurant is not a validated New York map listing' using errcode='23514';
      end if;
      new.restaurant_name:=place.name; new.address:=place.address;
      new.latitude:=place.latitude; new.longitude:=place.longitude;
      new.neighborhood:=place.borough; new.map_url:=place.source_url;
    end if;
  elsif new.restaurant_place_id is not null then
    raise exception 'The selected restaurant belongs to New York' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.food_tour_validate_location() from public;

alter table public.restaurant_visits drop constraint nyc_restaurant_requires_listing;
alter table public.restaurant_visits add constraint nyc_restaurant_requires_listing check (
  city<>'New York'
  or (restaurant_place_id is not null and latitude is not null and longitude is not null)
  or (
    restaurant_place_id is null and latitude is null and longitude is null
    and address='' and coalesce(neighborhood,'')='' and map_url is null
    and (length(trim(coalesce(restaurant_name,'')))>0 or status in ('Future','No restaurant'))
  )
);

create or replace function public.food_tour_save_visit(entry jsonb)
returns public.restaurant_visits language plpgsql security invoker set search_path='' as $$
declare cid integer; result public.restaurant_visits; title text;
begin
  if not food_tour_private.is_owner() then
    raise exception 'Only the journal owner can edit entries' using errcode='42501';
  end if;
  if exists(select 1 from public.restaurant_visits where entry_uuid=(entry->>'id')::uuid and city<>'New York') then
    raise exception 'This website only edits New York entries';
  end if;
  if coalesce(entry->>'city','New York')<>'New York' then
    raise exception 'This journal is for New York only';
  end if;
  select id into cid from public.countries where iso_code=entry->>'country';
  if cid is null then raise exception 'Choose a valid country'; end if;
  if coalesce(entry->>'status','') not in ('Visited','About to','No restaurant','Future') then
    raise exception 'Choose a valid status';
  end if;
  if jsonb_typeof(entry->'dishes') is distinct from 'array' or jsonb_array_length(entry->'dishes')>100 then
    raise exception 'Invalid dishes';
  end if;
  if exists(select 1 from jsonb_array_elements(entry->'dishes') d where
    jsonb_typeof(d)<>'object' or length(trim(coalesce(d->>'name','')))=0
    or coalesce((d->>'rating')::int,-1) not between 0 and 5
  ) then raise exception 'Each dish needs a name and a rating from 0 to 5'; end if;
  title:=trim(coalesce(entry->>'restaurant',''));
  if nullif(entry->>'placeId','') is null and title='' and entry->>'status' in ('Visited','About to') then
    raise exception 'Enter a restaurant name or select a New York map listing';
  end if;
  insert into public.restaurant_visits(
    entry_uuid,country_id,city,restaurant_place_id,restaurant_name,neighborhood,
    visit_date,status,notes,dishes,address,latitude,longitude,rating,photos,dish_objects
  ) values (
    (entry->>'id')::uuid,cid,'New York',nullif(entry->>'placeId',''),title,null,
    nullif(entry->>'date','')::date,entry->>'status',entry->>'review',
    coalesce((select jsonb_agg(d->>'name') from jsonb_array_elements(entry->'dishes') d),'[]'),
    '',null,null,(entry->>'rating')::smallint,entry->'photos',entry->'dishes'
  )
  on conflict(entry_uuid) do update set
    country_id=excluded.country_id,city=excluded.city,
    restaurant_place_id=excluded.restaurant_place_id,restaurant_name=excluded.restaurant_name,
    neighborhood=excluded.neighborhood,visit_date=excluded.visit_date,status=excluded.status,
    notes=excluded.notes,dishes=excluded.dishes,address=excluded.address,
    latitude=excluded.latitude,longitude=excluded.longitude,map_url=excluded.map_url,
    rating=excluded.rating,photos=excluded.photos,dish_objects=excluded.dish_objects,updated_at=now()
  returning * into result;
  return result;
end $$;
revoke all on function public.food_tour_save_visit(jsonb) from public;
grant execute on function public.food_tour_save_visit(jsonb) to authenticated;
