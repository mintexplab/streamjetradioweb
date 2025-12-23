import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRadioPlayer } from './useRadioPlayer';

interface ActiveListener {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  started_at: string;
  last_heartbeat: string;
}

export function useActiveListeners(stationUuid: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['active-listeners', stationUuid],
    queryFn: async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('active_listeners')
        .select('*')
        .eq('station_uuid', stationUuid)
        .gt('last_heartbeat', twoMinutesAgo);

      if (error) throw error;
      return data as ActiveListener[];
    },
    enabled: !!stationUuid,
    refetchInterval: 15000,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!stationUuid) return;

    const channel = supabase
      .channel(`listeners-${stationUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'active_listeners',
          filter: `station_uuid=eq.${stationUuid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-listeners', stationUuid] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationUuid, queryClient]);

  return query;
}

export function useListenerPresence() {
  const { user } = useAuth();
  const { currentStation, isPlaying } = useRadioPlayer();
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !currentStation || !isPlaying) {
      // Clear listener status when not playing
      if (user) {
        supabase
          .from('active_listeners')
          .delete()
          .eq('user_id', user.id)
          .then(() => {});
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      return;
    }

    // Upsert listener status
    const updatePresence = async () => {
      const { error } = await supabase
        .from('active_listeners')
        .upsert(
          {
            user_id: user.id,
            station_uuid: currentStation.stationuuid,
            station_name: currentStation.name,
            last_heartbeat: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) console.error('Failed to update presence:', error);
    };

    // Update immediately
    updatePresence();

    // Heartbeat every 30 seconds
    heartbeatRef.current = setInterval(updatePresence, 30000);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      // Clean up on unmount
      supabase
        .from('active_listeners')
        .delete()
        .eq('user_id', user.id)
        .then(() => {});
    };
  }, [user, currentStation?.stationuuid, isPlaying]);
}

export function useGlobalListenerCount() {
  return useQuery({
    queryKey: ['global-listener-count'],
    queryFn: async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      
      const { count, error } = await supabase
        .from('active_listeners')
        .select('*', { count: 'exact', head: true })
        .gt('last_heartbeat', twoMinutesAgo);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });
}
