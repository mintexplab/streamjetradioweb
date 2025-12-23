import { useQuery } from '@tanstack/react-query';

export interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  homepage: string;
  favicon: string;
  country: string;
  countrycode: string;
  state: string;
  language: string;
  languagecodes: string;
  votes: number;
  codec: string;
  bitrate: number;
  tags: string;
  clickcount: number;
  clicktrend: number;
}

const RADIO_BROWSER_API = 'https://de1.api.radio-browser.info/json';

async function fetchStations(endpoint: string, params?: Record<string, string>): Promise<RadioStation[]> {
  const url = new URL(`${RADIO_BROWSER_API}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  
  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error('Failed to fetch stations');
  }
  
  return response.json();
}

export function useSearchStations(query: string, limit = 50) {
  return useQuery({
    queryKey: ['stations', 'search', query],
    queryFn: () => fetchStations('/stations/byname/' + encodeURIComponent(query), {
      limit: limit.toString(),
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true',
    }),
    enabled: query.length > 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useTopStations(limit = 50) {
  return useQuery({
    queryKey: ['stations', 'top', limit],
    queryFn: () => fetchStations('/stations/topclick', {
      limit: limit.toString(),
      hidebroken: 'true',
    }),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useStationsByCountry(countryCode: string, limit = 50) {
  return useQuery({
    queryKey: ['stations', 'country', countryCode],
    queryFn: () => fetchStations('/stations/bycountrycodeexact/' + countryCode, {
      limit: limit.toString(),
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true',
    }),
    enabled: !!countryCode,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStationsByTag(tag: string, limit = 50) {
  return useQuery({
    queryKey: ['stations', 'tag', tag],
    queryFn: () => fetchStations('/stations/bytag/' + encodeURIComponent(tag), {
      limit: limit.toString(),
      hidebroken: 'true',
      order: 'clickcount',
      reverse: 'true',
    }),
    enabled: !!tag,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const response = await fetch(`${RADIO_BROWSER_API}/countries`);
      if (!response.ok) throw new Error('Failed to fetch countries');
      return response.json() as Promise<{ name: string; iso_3166_1: string; stationcount: number }[]>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await fetch(`${RADIO_BROWSER_API}/tags?limit=100&order=stationcount&reverse=true`);
      if (!response.ok) throw new Error('Failed to fetch tags');
      return response.json() as Promise<{ name: string; stationcount: number }[]>;
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}
