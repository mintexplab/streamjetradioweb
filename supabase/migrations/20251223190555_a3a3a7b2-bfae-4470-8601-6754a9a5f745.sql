-- Drop playlist-related tables (will be removed)
DROP TABLE IF EXISTS public.playlist_follows CASCADE;
DROP TABLE IF EXISTS public.playlist_stations CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  station_uuid TEXT,
  station_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create friendships table (bidirectional)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

-- Create listening_sessions table for tracking listening history
CREATE TABLE public.listening_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0
);

-- Create pinned_stations table (station library)
CREATE TABLE public.pinned_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  station_url TEXT NOT NULL,
  station_favicon TEXT,
  station_country TEXT,
  station_tags TEXT,
  is_go_to BOOLEAN DEFAULT false,
  pinned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, station_uuid)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listening_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_stations ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Users can create own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Friendships policies
CREATE POLICY "Users can view friendships they are part of" ON public.friendships 
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can send friend requests" ON public.friendships 
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update friendships they are addressee of" ON public.friendships 
  FOR UPDATE USING (auth.uid() = addressee_id);
CREATE POLICY "Users can delete friendships they are part of" ON public.friendships 
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Listening sessions policies
CREATE POLICY "Users can view all listening sessions" ON public.listening_sessions 
  FOR SELECT USING (true);
CREATE POLICY "Users can insert own sessions" ON public.listening_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.listening_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Pinned stations policies
CREATE POLICY "Users can view all pinned stations" ON public.pinned_stations 
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own pinned stations" ON public.pinned_stations 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pinned stations" ON public.pinned_stations 
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pinned stations" ON public.pinned_stations 
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_friendships_requester ON public.friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON public.friendships(addressee_id);
CREATE INDEX idx_friendships_status ON public.friendships(status);
CREATE INDEX idx_listening_sessions_user_id ON public.listening_sessions(user_id);
CREATE INDEX idx_listening_sessions_station ON public.listening_sessions(station_uuid);
CREATE INDEX idx_listening_sessions_started ON public.listening_sessions(started_at DESC);
CREATE INDEX idx_pinned_stations_user ON public.pinned_stations(user_id);

-- Enable realtime for social tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.listening_sessions;

-- Trigger for updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();