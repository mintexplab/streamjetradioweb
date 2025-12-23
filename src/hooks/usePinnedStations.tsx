import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RadioStation } from './useRadioStations';

export interface PinnedStation {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  station_url: string;
  station_favicon: string | null;
  station_country: string | null;
  station_tags: string | null;
  is_go_to: boolean;
  pinned_at: string;
}

export function usePinnedStations(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['pinned-stations', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('pinned_stations')
        .select('*')
        .eq('user_id', targetUserId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      return data as PinnedStation[];
    },
    enabled: !!targetUserId,
  });
}

export function useGoToStations(userId?: string) {
  const { data: pinnedStations } = usePinnedStations(userId);
  return pinnedStations?.filter(s => s.is_go_to) || [];
}

export function usePinStation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      station, 
      isGoTo = false 
    }: { 
      station: RadioStation; 
      isGoTo?: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('pinned_stations')
        .upsert({
          user_id: user.id,
          station_uuid: station.stationuuid,
          station_name: station.name,
          station_url: station.url_resolved || station.url,
          station_favicon: station.favicon || null,
          station_country: station.country || null,
          station_tags: station.tags || null,
          is_go_to: isGoTo,
        }, { onConflict: 'user_id,station_uuid' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-stations'] });
    },
  });
}

export function useUnpinStation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stationUuid: string) => {
      const { error } = await supabase
        .from('pinned_stations')
        .delete()
        .eq('station_uuid', stationUuid);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-stations'] });
    },
  });
}

export function useToggleGoTo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      stationId, 
      isGoTo 
    }: { 
      stationId: string; 
      isGoTo: boolean;
    }) => {
      const { data, error } = await supabase
        .from('pinned_stations')
        .update({ is_go_to: isGoTo })
        .eq('id', stationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pinned-stations'] });
    },
  });
}

export function useIsPinned(stationUuid: string) {
  const { data: pinnedStations } = usePinnedStations();
  return pinnedStations?.some(s => s.station_uuid === stationUuid) || false;
}
