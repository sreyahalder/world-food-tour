-- A country can include multiple restaurant stops, such as the two Bangladesh visits.
-- Keep entry_uuid uniqueness, city validation, owner permissions and archive privacy.
drop index if exists public.restaurant_visits_one_local_entry_per_country;
