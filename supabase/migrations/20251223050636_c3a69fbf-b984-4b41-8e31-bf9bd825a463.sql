-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create saved stations table
CREATE TABLE public.saved_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_url TEXT NOT NULL,
  station_favicon TEXT,
  station_country TEXT,
  station_tags TEXT,
  station_codec TEXT,
  station_bitrate INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, station_uuid)
);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create playlist stations junction table
CREATE TABLE public.playlist_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_url TEXT NOT NULL,
  station_favicon TEXT,
  station_country TEXT,
  station_tags TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (playlist_id, station_uuid)
);

-- Create playlist follows table (for following shared playlists)
CREATE TABLE public.playlist_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  followed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, playlist_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Saved stations policies
CREATE POLICY "Users can view own saved stations" 
ON public.saved_stations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved stations" 
ON public.saved_stations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved stations" 
ON public.saved_stations FOR DELETE USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Users can view own playlists" 
ON public.playlists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public playlists" 
ON public.playlists FOR SELECT USING (is_public = true);

CREATE POLICY "Users can insert own playlists" 
ON public.playlists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists" 
ON public.playlists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists" 
ON public.playlists FOR DELETE USING (auth.uid() = user_id);

-- Playlist stations policies
CREATE POLICY "Users can view stations in own playlists" 
ON public.playlist_stations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

CREATE POLICY "Anyone can view stations in public playlists" 
ON public.playlist_stations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND is_public = true
));

CREATE POLICY "Users can insert stations to own playlists" 
ON public.playlist_stations FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

CREATE POLICY "Users can update stations in own playlists" 
ON public.playlist_stations FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

CREATE POLICY "Users can delete stations from own playlists" 
ON public.playlist_stations FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

-- Playlist follows policies
CREATE POLICY "Users can view own follows" 
ON public.playlist_follows FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can follow playlists" 
ON public.playlist_follows FOR INSERT 
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE id = playlist_id AND is_public = true
));

CREATE POLICY "Users can unfollow playlists" 
ON public.playlist_follows FOR DELETE USING (auth.uid() = user_id);

-- Create function for has_role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Generate share codes for playlists
CREATE OR REPLACE FUNCTION public.generate_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND NEW.share_code IS NULL THEN
    NEW.share_code := substr(md5(random()::text || clock_timestamp()::text), 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER generate_playlist_share_code
  BEFORE INSERT OR UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_share_code();