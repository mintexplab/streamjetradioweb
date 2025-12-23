import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  images: { url: string; height: number; width: number }[];
  followers: { total: number };
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; height: number; width: number }[];
    release_date: string;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  uri: string;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  images: { url: string; height: number; width: number }[];
  release_date: string;
  total_tracks: number;
  album_type: string;
  external_urls: { spotify: string };
}

// Search artists using Spotify API via edge function
export function useSearchSpotifyArtists(query: string) {
  return useQuery({
    queryKey: ['spotify-search-artists', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'search',
          query,
          type: 'artist',
          limit: 20,
        },
      });

      if (error) throw error;

      return (data.artists?.items || []) as SpotifyArtist[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// Search tracks using Spotify API
export function useSearchSpotifyTracks(query: string) {
  return useQuery({
    queryKey: ['spotify-search-tracks', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'search',
          query,
          type: 'track',
          limit: 20,
        },
      });

      if (error) throw error;

      return (data.tracks?.items || []) as SpotifyTrack[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// Search albums using Spotify API
export function useSearchSpotifyAlbums(query: string) {
  return useQuery({
    queryKey: ['spotify-search-albums', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'search',
          query,
          type: 'album',
          limit: 20,
        },
      });

      if (error) throw error;

      return (data.albums?.items || []) as SpotifyAlbum[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
