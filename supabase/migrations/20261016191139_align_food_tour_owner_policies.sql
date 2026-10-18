create policy owners_no_direct_access on food_tour_private.owners for all to anon,authenticated using(false) with check(false);
create or replace function public.nyc_is_owner() returns boolean language sql stable security invoker set search_path='' as $$ select food_tour_private.is_owner() $$;
alter function public.nyc_touch_updated_at() set search_path='';
