-- Production Schema Synchronization for public.teachers
-- Safe, Idempotent, Non-Destructive Migration

-- 1. Add missing profile columns to public.teachers safely
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS arabic_name TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS teaching_language TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS years_experience INTEGER;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE public.teachers ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMPTZ;

-- 2. Ensure default constraints on onboarding and profile flags
ALTER TABLE public.teachers ALTER COLUMN onboarding_completed SET DEFAULT false;
ALTER TABLE public.teachers ALTER COLUMN profile_completed SET DEFAULT false;

-- 3. Synchronize existing completed profiles
UPDATE public.teachers
SET 
  profile_completed = true,
  profile_completed_at = COALESCE(profile_completed_at, now())
WHERE onboarding_completed = true AND (profile_completed IS NULL OR profile_completed = false);

-- 4. Safely backfill new columns from legacy fields for existing records
UPDATE public.teachers
SET 
  full_name = COALESCE(full_name, name),
  display_name = COALESCE(display_name, name),
  country = COALESCE(country, location),
  teaching_language = COALESCE(teaching_language, preferred_language, 'en'),
  years_experience = COALESCE(years_experience, years_of_experience),
  bio = COALESCE(bio, purpose)
WHERE full_name IS NULL 
   OR display_name IS NULL 
   OR country IS NULL 
   OR teaching_language IS NULL 
   OR years_experience IS NULL 
   OR bio IS NULL;
