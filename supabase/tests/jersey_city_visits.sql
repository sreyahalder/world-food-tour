begin;
do $$
declare cid integer; test_id uuid:=gen_random_uuid(); saved public.restaurant_visits; jc public.food_tour_restaurants; ny public.food_tour_restaurants;
begin
 select * into jc from public.food_tour_restaurants where city='Jersey City' and active limit 1;
 select * into ny from public.food_tour_restaurants where city='New York' and active limit 1;
 if jc.id is null or ny.id is null then raise exception 'Missing restaurant fixtures'; end if;
 select c.id into cid from public.countries c where not exists(select 1 from public.restaurant_visits v where v.country_id=c.id and v.city in ('New York','Jersey City')) order by c.id limit 1;
 if cid is null then raise exception 'Missing empty country fixture'; end if;
 insert into public.restaurant_visits(entry_uuid,country_id,city,restaurant_place_id,status,photos,dish_objects)
 values(test_id,cid,'Jersey City',jc.id,'Visited','[]','[]') returning * into saved;
 if saved.restaurant_name<>jc.name or saved.latitude<>jc.latitude or saved.longitude<>jc.longitude or saved.address<>jc.address or saved.map_url<>jc.source_url then raise exception 'Incorrect Jersey City location snapshot'; end if;
 begin
  update public.restaurant_visits set city='New York' where entry_uuid=test_id;
  raise exception 'Jersey City venue accepted as New York';
 exception when check_violation then null; end;
 begin
  update public.restaurant_visits set restaurant_place_id=ny.id where entry_uuid=test_id;
  raise exception 'New York venue accepted as Jersey City';
 exception when check_violation then null; end;
 insert into public.restaurant_visits(country_id,city,restaurant_place_id,status) values(cid,'New York',ny.id,'Visited');
 insert into public.restaurant_visits(country_id,city,restaurant_name,status) values(cid,'New York','Second New York stop','Visited');
 if (select count(*) from public.restaurant_visits where country_id=cid and city in ('New York','Jersey City'))<>3 then raise exception 'Multiple local restaurant stops were not retained'; end if;
 update public.restaurant_visits set restaurant_place_id=null,restaurant_name=' Closed Jersey City spot ',latitude=40.72,longitude=-74.08,address='Unverified' where entry_uuid=test_id returning * into saved;
 if saved.restaurant_name<>'Closed Jersey City spot' or saved.address<>'' or saved.latitude is not null or saved.longitude is not null or saved.map_url is not null then raise exception 'Name-only Jersey City location not cleared'; end if;
 begin
  update public.restaurant_visits set restaurant_name='' where entry_uuid=test_id;
  raise exception 'Blank Jersey City visit accepted';
 exception when check_violation then null; end;
 begin
  update public.food_tour_restaurants set source_url='https://example.com/unverified' where id=jc.id;
  raise exception 'Unverified provider source accepted';
 exception when check_violation then null; end;
 perform set_config('food_tour.test_entry',test_id::text,true);
end $$;
set local role anon;
do $$
begin
 if not exists(select 1 from public.restaurant_visits where entry_uuid=current_setting('food_tour.test_entry')::uuid) then raise exception 'Jersey City is not publicly readable'; end if;
 if exists(select 1 from public.restaurant_visits where city not in ('New York','Jersey City')) then raise exception 'Archive was exposed'; end if;
 begin
  perform public.food_tour_save_visit('{}'::jsonb);
  raise exception 'Anonymous RPC accepted';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role authenticated;
do $$
declare changed integer;
begin
 begin
  perform public.food_tour_save_visit('{}'::jsonb);
  raise exception 'Non-owner RPC accepted';
 exception when insufficient_privilege then null; end;
 update public.restaurant_visits set restaurant_name='Unauthorized' where entry_uuid=current_setting('food_tour.test_entry')::uuid;
 get diagnostics changed=row_count;
 if changed<>0 then raise exception 'Non-owner edit accepted'; end if;
end $$;
reset role;
select 'Jersey City snapshots, city matching, multiple same-country restaurant stops, name-only saves, source validation, archive privacy and owner access passed' as checks;
rollback;
