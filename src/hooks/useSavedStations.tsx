import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RadioStation } from './useRadioStations';

export interface SavedStation {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  station_url: string;
  station_favicon: string | null;
  station_country: string | null;
  station_tags: string | null;
  station_codec: string | null;
  station_bitrate: number | null;
  created_at: string;
}

export function useSavedStations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['saved-stations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_stations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedStation[];
    },
    enabled: !!user,
  });
}

export function useSaveStation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (station: RadioStation) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('saved_stations')
        .insert({
          user_id: user.id,
          station_uuid: station.stationuuid,
          station_name: station.name,
          station_url: station.url_resolved || station.url,
          station_favicon: station.favicon || null,
          station_country: station.country || null,
          station_tags: station.tags || null,
          station_codec: station.codec || null,
          station_bitrate: station.bitrate || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-stations'] });
    },
  });
}

export function useUnsaveStation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (stationUuid: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_stations')
        .delete()
        .eq('user_id', user.id)
        .eq('station_uuid', stationUuid);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-stations'] });
    },
  });
}

export function useIsStationSaved(stationUuid: string) {
  const { data: savedStations } = useSavedStations();
  return savedStations?.some(s => s.station_uuid === stationUuid) ?? false;
}
