begin;
-- Run inside a transaction and roll back all fixture writes.
do $$
declare
  cid integer;
  test_id uuid:=gen_random_uuid();
  saved public.restaurant_visits;
  venue public.food_tour_restaurants;
  dishes jsonb:='[{"id":"fixture-dish","name":"A remembered dish","description":"Keep these notes","rating":4,"photo":"https://example.com/dish.jpg"}]';
  photos jsonb:='["https://example.com/restaurant.jpg"]';
begin
  select c.id into cid from public.countries c
  where not exists(select 1 from public.restaurant_visits v where v.country_id=c.id and v.city in ('New York','Jersey City'))
  order by c.id limit 1;
  if cid is null then raise exception 'No empty country available for rollback test'; end if;

  insert into public.restaurant_visits(
    entry_uuid,country_id,city,restaurant_name,status,notes,rating,photos,dish_objects,
    address,neighborhood,latitude,longitude,map_url
  ) values (
    test_id,cid,'New York','  A closed restaurant  ','Visited','Keep this memory',4,photos,dishes,
    'Unverified address','Unverified area',40.75,-73.99,'https://example.com/unverified'
  ) returning * into saved;
  if saved.restaurant_name<>'A closed restaurant' or saved.restaurant_place_id is not null
    or saved.latitude is not null or saved.longitude is not null or saved.address<>''
    or saved.neighborhood<>'' or saved.map_url is not null then
    raise exception 'Name-only entries must keep the title without a map location';
  end if;

  update public.restaurant_visits set restaurant_name='Renamed closed restaurant'
  where entry_uuid=test_id returning * into saved;
  if saved.restaurant_name<>'Renamed closed restaurant' or saved.dish_objects<>dishes
    or saved.photos<>photos or saved.notes<>'Keep this memory' or saved.status<>'Visited' then
    raise exception 'Reopening and editing must preserve the visit and media';
  end if;

  begin
    update public.restaurant_visits set restaurant_name='   ' where entry_uuid=test_id;
    raise exception 'Blank visited restaurant was accepted';
  exception when check_violation then null; end;
  begin
    update public.restaurant_visits set restaurant_name='',status='About to' where entry_uuid=test_id;
    raise exception 'Blank planned restaurant was accepted';
  exception when check_violation then null; end;
  begin
    update public.restaurant_visits set restaurant_place_id='osm:node:0' where entry_uuid=test_id;
    raise exception 'Unregistered venue was accepted';
  exception when check_violation then null; end;
  begin
    insert into public.restaurant_visits(entry_uuid,country_id,city,restaurant_name,status)
    values(test_id,cid,'New York','Another memory','Visited');
    raise exception 'Duplicate entry identity was accepted';
  exception when unique_violation then null; end;

  select * into venue from public.food_tour_restaurants where active=true and city='New York' order by id limit 1;
  if venue.id is null then raise exception 'Missing verified venue fixture'; end if;
  update public.restaurant_visits set restaurant_place_id=venue.id,restaurant_name='Incorrect title'
  where entry_uuid=test_id returning * into saved;
  if saved.restaurant_name<>venue.name or saved.latitude<>venue.latitude or saved.longitude<>venue.longitude
    or saved.address<>venue.address or saved.map_url<>venue.source_url then
    raise exception 'Verified venues must still use canonical map data';
  end if;

  update public.restaurant_visits set restaurant_place_id=null,restaurant_name='Back to name only'
  where entry_uuid=test_id returning * into saved;
  if saved.latitude is not null or saved.longitude is not null or saved.map_url is not null
    or saved.address<>'' or saved.dish_objects<>dishes or saved.photos<>photos then
    raise exception 'Switching to a name must clear map data and keep media';
  end if;

  update public.restaurant_visits set restaurant_name='',status='Future' where entry_uuid=test_id;
  update public.restaurant_visits set status='No restaurant' where entry_uuid=test_id;

  if not public.food_tour_is_owner() then
    begin
      perform public.food_tour_save_visit(jsonb_build_object('id',test_id,'restaurant','Unauthorized'));
      raise exception 'Unauthenticated save was accepted';
    exception when insufficient_privilege then null; end;
  end if;

  perform set_config('food_tour.test_entry',test_id::text,true);
end $$;

set local role anon;
do $$
begin
  begin
    perform public.food_tour_save_visit('{}'::jsonb);
    raise exception 'Anonymous RPC access was accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

set local role authenticated;
do $$
declare changed integer;
begin
  begin
    perform public.food_tour_save_visit('{}'::jsonb);
    raise exception 'Non-owner RPC access was accepted';
  exception when insufficient_privilege then null; end;
  update public.restaurant_visits set restaurant_name='Unauthorized edit'
  where entry_uuid=current_setting('food_tour.test_entry')::uuid;
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Non-owner table edit was accepted'; end if;
end $$;
reset role;

select 'Name-only create/edit, media preservation, location clearing, verified listing validation, entry identity, notes-only statuses and owner access all passed' as checks;

rollback;
