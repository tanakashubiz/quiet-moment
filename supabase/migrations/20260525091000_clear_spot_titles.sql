UPDATE public.spots
SET title = ''
WHERE title <> '';

ALTER TABLE public.spots
ALTER COLUMN title SET DEFAULT '';
