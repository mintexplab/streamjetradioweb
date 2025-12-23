import { useQuery } from '@tanstack/react-query';

const AUDIO_DB_BASE_URL = 'https://www.theaudiodb.com/api/v1/json/2';

export interface AudioDBArtist {
  idArtist: string;
  strArtist: string;
  strArtistAlternate: string | null;
  strLabel: string | null;
  idLabel: string | null;
  intFormedYear: string | null;
  intBornYear: string | null;
  intDiedYear: string | null;
  strDisbanded: string | null;
  strStyle: string | null;
  strGenre: string | null;
  strMood: string | null;
  strWebsite: string | null;
  strFacebook: string | null;
  strTwitter: string | null;
  strBiographyEN: string | null;
  strBiographyDE: string | null;
  strBiographyFR: string | null;
  strBiographyES: string | null;
  strBiographyIT: string | null;
  strBiographyPT: string | null;
  strBiographyJP: string | null;
  strCountry: string | null;
  strCountryCode: string | null;
  strArtistThumb: string | null;
  strArtistLogo: string | null;
  strArtistCutout: string | null;
  strArtistClearart: string | null;
  strArtistWideThumb: string | null;
  strArtistFanart: string | null;
  strArtistFanart2: string | null;
  strArtistFanart3: string | null;
  strArtistBanner: string | null;
  strMusicBrainzID: string | null;
  strLastFMChart: string | null;
  intMembers: string | null;
  strLocked: string | null;
}

export interface AudioDBAlbum {
  idAlbum: string;
  idArtist: string;
  strAlbum: string;
  strArtist: string;
  intYearReleased: string | null;
  strStyle: string | null;
  strGenre: string | null;
  strLabel: string | null;
  strReleaseFormat: string | null;
  intSales: string | null;
  strAlbumThumb: string | null;
  strAlbumThumbHQ: string | null;
  strDescriptionEN: string | null;
  strMood: string | null;
  strSpeed: string | null;
  strTheme: string | null;
}

export interface AudioDBTrack {
  idTrack: string;
  idAlbum: string;
  idArtist: string;
  strTrack: string;
  strAlbum: string;
  strArtist: string;
  intDuration: string | null;
  strGenre: string | null;
  strMood: string | null;
  strTheme: string | null;
  strTrackThumb: string | null;
  strMusicVid: string | null;
}

// Search artists
export function useSearchArtists(query: string) {
  return useQuery({
    queryKey: ['audiodb-search-artists', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const response = await fetch(
        `${AUDIO_DB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) throw new Error('Failed to search artists');
      
      const data = await response.json();
      return (data.artists || []) as AudioDBArtist[];
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

// Get artist by ID
export function useArtistDetails(artistId: string) {
  return useQuery({
    queryKey: ['audiodb-artist', artistId],
    queryFn: async () => {
      const response = await fetch(
        `${AUDIO_DB_BASE_URL}/artist.php?i=${artistId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch artist');
      
      const data = await response.json();
      return (data.artists?.[0] || null) as AudioDBArtist | null;
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });
}

// Get artist discography
export function useArtistDiscography(artistId: string) {
  return useQuery({
    queryKey: ['audiodb-discography', artistId],
    queryFn: async () => {
      const response = await fetch(
        `${AUDIO_DB_BASE_URL}/album.php?i=${artistId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch discography');
      
      const data = await response.json();
      return (data.album || []) as AudioDBAlbum[];
    },
    enabled: !!artistId,
    staleTime: 1000 * 60 * 30,
  });
}

// Get tracks from album
export function useAlbumTracks(albumId: string) {
  return useQuery({
    queryKey: ['audiodb-album-tracks', albumId],
    queryFn: async () => {
      const response = await fetch(
        `${AUDIO_DB_BASE_URL}/track.php?m=${albumId}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch tracks');
      
      const data = await response.json();
      return (data.track || []) as AudioDBTrack[];
    },
    enabled: !!albumId,
    staleTime: 1000 * 60 * 30,
  });
}

// Search tracks
export function useSearchTracks(artistName: string, trackName: string) {
  return useQuery({
    queryKey: ['audiodb-search-track', artistName, trackName],
    queryFn: async () => {
      if (!artistName || !trackName) return null;
      
      const response = await fetch(
        `${AUDIO_DB_BASE_URL}/searchtrack.php?s=${encodeURIComponent(artistName)}&t=${encodeURIComponent(trackName)}`
      );
      
      if (!response.ok) throw new Error('Failed to search track');
      
      const data = await response.json();
      return (data.track?.[0] || null) as AudioDBTrack | null;
    },
    enabled: !!artistName && !!trackName,
    staleTime: 1000 * 60 * 30,
  });
}

// Get trending artists (top chart)
export function useTrendingArtists() {
  return useQuery({
    queryKey: ['audiodb-trending'],
    queryFn: async () => {
      // AudioDB free tier doesn't have a trending endpoint, 
      // so we'll use some popular artists as fallback
      const popularArtists = ['Coldplay', 'Taylor Swift', 'The Weeknd', 'Dua Lipa', 'Ed Sheeran'];
      const artists: AudioDBArtist[] = [];
      
      for (const name of popularArtists) {
        try {
          const response = await fetch(
            `${AUDIO_DB_BASE_URL}/search.php?s=${encodeURIComponent(name)}`
          );
          const data = await response.json();
          if (data.artists?.[0]) {
            artists.push(data.artists[0]);
          }
        } catch {
          // Continue with other artists
        }
      }
      
      return artists;
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
}
