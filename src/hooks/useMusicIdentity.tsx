import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface FavoriteArtist {
  id: string;
  user_id: string;
  artist_id: string;
  artist_name: string;
  artist_image: string | null;
  position: number;
  created_at: string;
}

export interface FavoriteTrack {
  id: string;
  user_id: string;
  track_id: string;
  track_name: string;
  artist_name: string;
  album_name: string | null;
  track_image: string | null;
  position: number;
  created_at: string;
}

export interface UserMusicRole {
  id: string;
  user_id: string;
  role_type: 'instrument' | 'role';
  role_name: string;
  created_at: string;
}

// Favorite Artists
export function useFavoriteArtists(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['favorite-artists', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('favorite_artists')
        .select('*')
        .eq('user_id', targetUserId)
        .order('position');

      if (error) throw error;
      return data as FavoriteArtist[];
    },
    enabled: !!targetUserId,
  });
}

export function useAddFavoriteArtist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (artist: { 
      artist_id: string; 
      artist_name: string; 
      artist_image?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Get current max position
      const { data: existing } = await supabase
        .from('favorite_artists')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('favorite_artists')
        .insert({
          user_id: user.id,
          artist_id: artist.artist_id,
          artist_name: artist.artist_name,
          artist_image: artist.artist_image || null,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-artists'] });
    },
  });
}

export function useRemoveFavoriteArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artistId: string) => {
      const { error } = await supabase
        .from('favorite_artists')
        .delete()
        .eq('id', artistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-artists'] });
    },
  });
}

export function useReorderFavoriteArtists() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      if (!user) throw new Error('Not authenticated');

      const updates = orderedIds.map((id, index) => ({
        id,
        user_id: user.id,
        position: index,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('favorite_artists')
          .update({ position: update.position })
          .eq('id', update.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-artists'] });
    },
  });
}

// Favorite Tracks
export function useFavoriteTracks(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['favorite-tracks', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('favorite_tracks')
        .select('*')
        .eq('user_id', targetUserId)
        .order('position');

      if (error) throw error;
      return data as FavoriteTrack[];
    },
    enabled: !!targetUserId,
  });
}

export function useAddFavoriteTrack() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (track: { 
      track_id: string; 
      track_name: string; 
      artist_name: string;
      album_name?: string;
      track_image?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await supabase
        .from('favorite_tracks')
        .select('position')
        .eq('user_id', user.id)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const { data, error } = await supabase
        .from('favorite_tracks')
        .insert({
          user_id: user.id,
          track_id: track.track_id,
          track_name: track.track_name,
          artist_name: track.artist_name,
          album_name: track.album_name || null,
          track_image: track.track_image || null,
          position: nextPosition,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-tracks'] });
    },
  });
}

export function useRemoveFavoriteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      const { error } = await supabase
        .from('favorite_tracks')
        .delete()
        .eq('id', trackId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-tracks'] });
    },
  });
}

// User Music Roles
export function useUserMusicRoles(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-music-roles', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_music_roles')
        .select('*')
        .eq('user_id', targetUserId)
        .order('role_type', { ascending: true });

      if (error) throw error;
      return data as UserMusicRole[];
    },
    enabled: !!targetUserId,
  });
}

export function useAddMusicRole() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ roleType, roleName }: { roleType: 'instrument' | 'role'; roleName: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_music_roles')
        .insert({
          user_id: user.id,
          role_type: roleType,
          role_name: roleName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-music-roles'] });
    },
  });
}

export function useRemoveMusicRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from('user_music_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-music-roles'] });
    },
  });
}

// Music Identity Compatibility
export function useMusicIdentityCompatibility(otherUserId: string) {
  const { user } = useAuth();
  const { data: myArtists } = useFavoriteArtists(user?.id);
  const { data: theirArtists } = useFavoriteArtists(otherUserId);
  const { data: myTracks } = useFavoriteTracks(user?.id);
  const { data: theirTracks } = useFavoriteTracks(otherUserId);

  if (!myArtists || !theirArtists || !myTracks || !theirTracks) {
    return { score: 0, sharedArtists: [], sharedTracks: [] };
  }

  const myArtistIds = new Set(myArtists.map(a => a.artist_id));
  const theirArtistIds = new Set(theirArtists.map(a => a.artist_id));
  const sharedArtistIds = [...myArtistIds].filter(id => theirArtistIds.has(id));
  
  const myTrackIds = new Set(myTracks.map(t => t.track_id));
  const theirTrackIds = new Set(theirTracks.map(t => t.track_id));
  const sharedTrackIds = [...myTrackIds].filter(id => theirTrackIds.has(id));

  const sharedArtists = myArtists.filter(a => sharedArtistIds.includes(a.artist_id));
  const sharedTracks = myTracks.filter(t => sharedTrackIds.includes(t.track_id));

  // Calculate compatibility score
  const artistWeight = 0.6;
  const trackWeight = 0.4;
  
  const maxArtists = Math.max(myArtists.length, theirArtists.length, 1);
  const maxTracks = Math.max(myTracks.length, theirTracks.length, 1);
  
  const artistScore = (sharedArtists.length / maxArtists) * 100;
  const trackScore = (sharedTracks.length / maxTracks) * 100;
  
  const score = Math.round(artistScore * artistWeight + trackScore * trackWeight);

  return { score, sharedArtists, sharedTracks };
}
