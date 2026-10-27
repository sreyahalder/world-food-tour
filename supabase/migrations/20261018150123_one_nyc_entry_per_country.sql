-- Each country has one New York journal entry. The California archive is
-- outside this rule. Existing entries and planning suggestions are retained.
create unique index restaurant_visits_one_nyc_entry_per_country
 on public.restaurant_visits(country_id)
 where city = 'New York';
