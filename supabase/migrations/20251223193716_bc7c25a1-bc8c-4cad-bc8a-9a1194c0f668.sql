-- Create station chat messages table
CREATE TABLE public.station_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  station_uuid TEXT NOT NULL,
  station_name TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.station_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages (they're public chat rooms)
CREATE POLICY "Anyone can view station chat messages"
  ON public.station_chat_messages
  FOR SELECT
  USING (true);

-- Authenticated users can post messages
CREATE POLICY "Authenticated users can post messages"
  ON public.station_chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
  ON public.station_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.station_chat_messages;

-- Create index for faster queries by station
CREATE INDEX idx_station_chat_station_uuid ON public.station_chat_messages(station_uuid);
CREATE INDEX idx_station_chat_created_at ON public.station_chat_messages(created_at DESC);