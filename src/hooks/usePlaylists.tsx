import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RadioStation } from './useRadioStations';

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlaylistStation {
  id: string;
  playlist_id: string;
  station_uuid: string;
  station_name: string;
  station_url: string;
  station_favicon: string | null;
  station_country: string | null;
  station_tags: string | null;
  position: number;
  added_at: string;
}

export function usePlaylists() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['playlists', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as Playlist[];
    },
    enabled: !!user,
  });
}

export function usePlaylist(playlistId: string) {
  return useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('id', playlistId)
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    enabled: !!playlistId,
  });
}

export function usePlaylistByShareCode(shareCode: string) {
  return useQuery({
    queryKey: ['playlist', 'share', shareCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('share_code', shareCode)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    enabled: !!shareCode,
  });
}

export function usePlaylistStations(playlistId: string) {
  return useQuery({
    queryKey: ['playlist-stations', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_stations')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as PlaylistStation[];
    },
    enabled: !!playlistId,
  });
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description, isPublic }: { name: string; description?: string; isPublic?: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          is_public: isPublic ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

export function useUpdatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Playlist> & { id: string }) => {
      const { data, error } = await supabase
        .from('playlists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Playlist;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', data.id] });
    },
  });
}

export function useDeletePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
  });
}

export function useAddStationToPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, station }: { playlistId: string; station: RadioStation }) => {
      // Get current max position
      const { data: existing } = await supabase
        .from('playlist_stations')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('playlist_stations')
        .insert({
          playlist_id: playlistId,
          station_uuid: station.stationuuid,
          station_name: station.name,
          station_url: station.url_resolved || station.url,
          station_favicon: station.favicon || null,
          station_country: station.country || null,
          station_tags: station.tags || null,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-stations', playlistId] });
    },
  });
}

export function useRemoveStationFromPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, stationUuid }: { playlistId: string; stationUuid: string }) => {
      const { error } = await supabase
        .from('playlist_stations')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('station_uuid', stationUuid);

      if (error) throw error;
    },
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries({ queryKey: ['playlist-stations', playlistId] });
    },
  });
}
