import { useQuery } from '@tanstack/react-query';

// Spotify Web API base URL
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// We'll use the public Spotify Search API through a CORS proxy for basic searches
// For production, you'd want to use proper OAuth or a backend proxy

export interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: { total: number };
  images: { url: string; width: number; height: number }[];
  external_urls: { spotify: string };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
    release_date: string;
  };
  duration_ms: number;
  popularity: number;
  preview_url: string | null;
  external_urls: { spotify: string };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  images: { url: string; width: number; height: number }[];
  release_date: string;
  total_tracks: number;
  album_type: string;
  external_urls: { spotify: string };
}

// Use MusicBrainz + Cover Art Archive as fallback (no API key required)
const MUSICBRAINZ_API = 'https://musicbrainz.org/ws/2';
const COVERART_API = 'https://coverartarchive.org';

interface MusicBrainzArtist {
  id: string;
  name: string;
  type: string;
  country?: string;
  disambiguation?: string;
  'life-span'?: { begin?: string; end?: string; ended?: boolean };
}

interface MusicBrainzRecording {
  id: string;
  title: string;
  'artist-credit': { name: string; artist: { id: string; name: string } }[];
  releases?: { id: string; title: string; date?: string }[];
}

// Search artists using MusicBrainz
export function useSearchArtists(query: string) {
  return useQuery({
    queryKey: ['spotify-search-artists', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const response = await fetch(
        `${MUSICBRAINZ_API}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=20`,
        {
          headers: {
            'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to search artists');

      const data = await response.json();
      
      return (data.artists || []).map((artist: MusicBrainzArtist) => ({
        id: artist.id,
        name: artist.name,
        genres: [],
        popularity: 0,
        followers: { total: 0 },
        images: [],
        type: artist.type,
        country: artist.country,
        disambiguation: artist.disambiguation,
        lifeSpan: artist['life-span'],
        external_urls: { 
          musicbrainz: `https://musicbrainz.org/artist/${artist.id}` 
        },
      }));
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// Search tracks using MusicBrainz
export function useSearchTracks(query: string) {
  return useQuery({
    queryKey: ['spotify-search-tracks', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const response = await fetch(
        `${MUSICBRAINZ_API}/recording?query=${encodeURIComponent(query)}&fmt=json&limit=20`,
        {
          headers: {
            'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to search tracks');

      const data = await response.json();
      
      return (data.recordings || []).map((recording: MusicBrainzRecording) => ({
        id: recording.id,
        name: recording.title,
        artists: recording['artist-credit']?.map(ac => ({
          id: ac.artist.id,
          name: ac.artist.name,
        })) || [],
        album: {
          id: recording.releases?.[0]?.id || '',
          name: recording.releases?.[0]?.title || 'Unknown Album',
          images: [],
          release_date: recording.releases?.[0]?.date || '',
        },
        duration_ms: 0,
        popularity: 0,
        preview_url: null,
        external_urls: { 
          musicbrainz: `https://musicbrainz.org/recording/${recording.id}` 
        },
      }));
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}

// Get artist details
export function useArtistDetails(artistId: string) {
  return useQuery({
    queryKey: ['spotify-artist', artistId],
    queryFn: async () => {
      const response = await fetch(
        `${MUSICBRAINZ_API}/artist/${artistId}?inc=url-rels+release-groups&fmt=json`,
        {
          headers: {
            'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch artist');

      const artist = await response.json();
      
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        type: artist.type,
        country: artist.country,
        disambiguation: artist.disambiguation,
        lifeSpan: artist['life-span'],
        releaseGroups: artist['release-groups'] || [],
        relations: artist.relations || [],
      };
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 30,
  });
}

// Get artist albums/discography
export function useArtistDiscography(artistId: string) {
  return useQuery({
    queryKey: ['spotify-discography', artistId],
    queryFn: async () => {
      const response = await fetch(
        `${MUSICBRAINZ_API}/release-group?artist=${artistId}&type=album&fmt=json&limit=50`,
        {
          headers: {
            'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch discography');

      const data = await response.json();
      
      return (data['release-groups'] || []).map((rg: any) => ({
        id: rg.id,
        name: rg.title,
        artists: rg['artist-credit']?.map((ac: any) => ({
          id: ac.artist.id,
          name: ac.artist.name,
        })) || [],
        images: [],
        release_date: rg['first-release-date'] || '',
        total_tracks: 0,
        album_type: rg['primary-type'] || 'Album',
        external_urls: { 
          musicbrainz: `https://musicbrainz.org/release-group/${rg.id}` 
        },
      }));
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 30,
  });
}

// Get album cover art
export function useAlbumArt(releaseGroupId: string) {
  return useQuery({
    queryKey: ['album-art', releaseGroupId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${COVERART_API}/release-group/${releaseGroupId}`,
          {
            headers: {
              'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
            },
          }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return data.images?.[0]?.thumbnails?.small || data.images?.[0]?.image || null;
      } catch {
        return null;
      }
    },
    enabled: !!releaseGroupId,
    staleTime: 1000 * 60 * 60,
    retry: false,
  });
}

// Trending/popular searches (curated list since MusicBrainz doesn't have charts)
export function useTrendingArtists() {
  return useQuery({
    queryKey: ['trending-artists'],
    queryFn: async () => {
      const popularArtists = [
        'Taylor Swift', 'The Weeknd', 'Drake', 'Bad Bunny', 'Ed Sheeran',
        'Dua Lipa', 'Billie Eilish', 'Post Malone', 'Ariana Grande', 'Travis Scott'
      ];

      const artists = await Promise.all(
        popularArtists.slice(0, 5).map(async (name) => {
          try {
            const response = await fetch(
              `${MUSICBRAINZ_API}/artist?query=${encodeURIComponent(name)}&fmt=json&limit=1`,
              {
                headers: {
                  'User-Agent': 'StreamJetRadio/1.0 (contact@streamjet.app)',
                },
              }
            );
            const data = await response.json();
            return data.artists?.[0] || null;
          } catch {
            return null;
          }
        })
      );

      return artists.filter(Boolean).map((artist: any) => ({
        id: artist.id,
        name: artist.name,
        genres: [],
        type: artist.type,
        country: artist.country,
      }));
    },
    staleTime: 1000 * 60 * 60,
  });
}
