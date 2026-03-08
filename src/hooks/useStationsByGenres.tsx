import { useQuery } from '@tanstack/react-query';
import { RadioStation } from './useRadioStations';

const RADIO_BROWSER_API = 'https://de1.api.radio-browser.info/json';

const GENRE_CATEGORIES = [
  { label: 'Popular Right Now', tag: '', isTop: true },
  { label: 'Pop Hits', tag: 'pop' },
  { label: 'Rock', tag: 'rock' },
  { label: 'Jazz & Blues', tag: 'jazz' },
  { label: 'Electronic & Dance', tag: 'electronic' },
  { label: 'Hip Hop & R&B', tag: 'hip hop' },
  { label: 'Classical', tag: 'classical' },
  { label: 'Latin Vibes', tag: 'latin' },
  { label: 'Country', tag: 'country' },
  { label: 'Chill & Ambient', tag: 'ambient' },
];

export { GENRE_CATEGORIES };

export function useStationsByGenres() {
  return GENRE_CATEGORIES.map((genre) => {
    const query = useQuery({
      queryKey: genre.isTop
        ? ['stations', 'top', 5]
        : ['stations', 'genre-row', genre.tag],
      queryFn: async (): Promise<RadioStation[]> => {
        const endpoint = genre.isTop
          ? '/stations/topclick'
          : `/stations/bytag/${encodeURIComponent(genre.tag)}`;
        const params = new URLSearchParams({
          limit: '5',
          hidebroken: 'true',
          order: 'clickcount',
          reverse: 'true',
        });
        const res = await fetch(`${RADIO_BROWSER_API}${endpoint}?${params}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      },
      staleTime: 1000 * 60 * 10,
    });

    return {
      label: genre.label,
      tag: genre.tag,
      stations: query.data || [],
      isLoading: query.isLoading,
    };
  });
}
