-- Create enum for reaction types
CREATE TYPE public.reaction_type AS ENUM ('fire', 'wave', 'crying', 'sleep');

-- Create station_reactions table for live reactions
CREATE TABLE public.station_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  reaction_type reaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 minutes')
);

-- Enable RLS
ALTER TABLE public.station_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for station_reactions
CREATE POLICY "Anyone can view reactions" ON public.station_reactions
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create reactions" ON public.station_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions" ON public.station_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Create station_moments table
CREATE TABLE public.station_moments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  moment_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '2 hours')
);

-- Enable RLS
ALTER TABLE public.station_moments ENABLE ROW LEVEL SECURITY;

-- RLS policies for station_moments
CREATE POLICY "Anyone can view active moments" ON public.station_moments
  FOR SELECT USING (expires_at > now());

CREATE POLICY "Users can create moments" ON public.station_moments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create user_station_stats for tracking user taste
CREATE TABLE public.user_station_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  fire_count INTEGER NOT NULL DEFAULT 0,
  wave_count INTEGER NOT NULL DEFAULT 0,
  crying_count INTEGER NOT NULL DEFAULT 0,
  sleep_count INTEGER NOT NULL DEFAULT 0,
  total_listen_time INTEGER NOT NULL DEFAULT 0,
  last_listened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, station_uuid)
);

-- Enable RLS
ALTER TABLE public.user_station_stats ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_station_stats
CREATE POLICY "Users can view all stats" ON public.user_station_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own stats" ON public.user_station_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.user_station_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Create active_listeners table for live presence
CREATE TABLE public.active_listeners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_heartbeat TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.active_listeners ENABLE ROW LEVEL SECURITY;

-- RLS policies for active_listeners
CREATE POLICY "Anyone can view active listeners" ON public.active_listeners
  FOR SELECT USING (last_heartbeat > now() - interval '2 minutes');

CREATE POLICY "Users can manage own listener status" ON public.active_listeners
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own listener status" ON public.active_listeners
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own listener status" ON public.active_listeners
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_reactions_station ON public.station_reactions(station_uuid, expires_at);
CREATE INDEX idx_reactions_user ON public.station_reactions(user_id);
CREATE INDEX idx_moments_station ON public.station_moments(station_uuid, expires_at);
CREATE INDEX idx_listeners_station ON public.active_listeners(station_uuid, last_heartbeat);
CREATE INDEX idx_stats_user ON public.user_station_stats(user_id);

-- Enable realtime for reactions and listeners
ALTER PUBLICATION supabase_realtime ADD TABLE public.station_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_listeners;

-- Create updated_at trigger for user_station_stats
CREATE TRIGGER update_user_station_stats_updated_at
  BEFORE UPDATE ON public.user_station_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();