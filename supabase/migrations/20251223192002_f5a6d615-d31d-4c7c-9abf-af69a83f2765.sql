-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'friend_request', 'friend_accepted', 'friend_listening'
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Neighborhoods table
CREATE TABLE public.neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  vibe_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view neighborhoods" ON public.neighborhoods
  FOR SELECT USING (true);

-- User neighborhood memberships (auto-assigned based on listening patterns)
CREATE TABLE public.user_neighborhoods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  neighborhood_id UUID NOT NULL REFERENCES public.neighborhoods(id) ON DELETE CASCADE,
  affinity_score NUMERIC DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, neighborhood_id)
);

ALTER TABLE public.user_neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user neighborhoods" ON public.user_neighborhoods
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own neighborhoods" ON public.user_neighborhoods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own neighborhoods" ON public.user_neighborhoods
  FOR UPDATE USING (auth.uid() = user_id);

-- Favorite artists
CREATE TABLE public.favorite_artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  artist_id TEXT NOT NULL, -- External API ID
  artist_name TEXT NOT NULL,
  artist_image TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, artist_id)
);

ALTER TABLE public.favorite_artists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view favorite artists" ON public.favorite_artists
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own favorite artists" ON public.favorite_artists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite artists" ON public.favorite_artists
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite artists" ON public.favorite_artists
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_favorite_artists_user ON public.favorite_artists(user_id);

-- Favorite tracks
CREATE TABLE public.favorite_tracks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  track_id TEXT NOT NULL, -- External API ID
  track_name TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  album_name TEXT,
  track_image TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.favorite_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view favorite tracks" ON public.favorite_tracks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own favorite tracks" ON public.favorite_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorite tracks" ON public.favorite_tracks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite tracks" ON public.favorite_tracks
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_favorite_tracks_user ON public.favorite_tracks(user_id);

-- User music roles/instruments
CREATE TABLE public.user_music_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role_type TEXT NOT NULL, -- 'instrument', 'role'
  role_name TEXT NOT NULL, -- e.g., 'guitar', 'producer', 'vocalist'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_type, role_name)
);

ALTER TABLE public.user_music_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user music roles" ON public.user_music_roles
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own music roles" ON public.user_music_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own music roles" ON public.user_music_roles
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_music_roles ON public.user_music_roles(user_id);

-- Insert default neighborhoods
INSERT INTO public.neighborhoods (name, description, vibe_tags) VALUES
  ('Night Owls', 'Late-night listeners who tune in after midnight', ARRAY['nocturnal', 'chill', 'ambient']),
  ('Morning Commuters', 'Early birds catching their morning vibes', ARRAY['upbeat', 'energetic', 'news']),
  ('Ambient Explorers', 'Those who love atmospheric and ambient soundscapes', ARRAY['ambient', 'chill', 'electronic']),
  ('Jazz Enthusiasts', 'Lovers of jazz, blues, and smooth sounds', ARRAY['jazz', 'blues', 'smooth']),
  ('Electronic Pioneers', 'EDM, house, techno, and electronic music fans', ARRAY['electronic', 'dance', 'house']),
  ('World Wanderers', 'Exploring music from around the globe', ARRAY['world', 'cultural', 'diverse']),
  ('Rock Rebels', 'Rock, metal, and alternative music lovers', ARRAY['rock', 'metal', 'alternative']),
  ('Classical Minds', 'Appreciators of classical and orchestral music', ARRAY['classical', 'orchestral', 'relaxing']);