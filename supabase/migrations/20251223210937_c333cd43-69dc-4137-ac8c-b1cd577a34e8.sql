-- Add verified column to profiles
ALTER TABLE public.profiles ADD COLUMN is_verified boolean NOT NULL DEFAULT false;