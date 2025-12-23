import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ReactionType = 'fire' | 'wave' | 'crying' | 'sleep';

export const REACTION_EMOJIS: Record<ReactionType, { emoji: string; label: string }> = {
  fire: { emoji: '🔥', label: 'This station is cooking' },
  wave: { emoji: '🌊', label: 'Immaculate vibe' },
  crying: { emoji: '😭', label: 'Why is this hitting' },
  sleep: { emoji: '💤', label: 'Respectfully… no' },
};

interface StationReaction {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  reaction_type: ReactionType;
  created_at: string;
  expires_at: string;
}

interface ReactionCounts {
  fire: number;
  wave: number;
  crying: number;
  sleep: number;
  total: number;
}

export function useStationReactions(stationUuid: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['station-reactions', stationUuid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_reactions')
        .select('*')
        .eq('station_uuid', stationUuid)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      return data as StationReaction[];
    },
    enabled: !!stationUuid,
    refetchInterval: 10000, // Refetch every 10 seconds for live feel
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!stationUuid) return;

    const channel = supabase
      .channel(`reactions-${stationUuid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'station_reactions',
          filter: `station_uuid=eq.${stationUuid}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['station-reactions', stationUuid] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationUuid, queryClient]);

  // Calculate counts
  const counts: ReactionCounts = {
    fire: 0,
    wave: 0,
    crying: 0,
    sleep: 0,
    total: 0,
  };

  if (query.data) {
    query.data.forEach((reaction) => {
      counts[reaction.reaction_type]++;
      counts.total++;
    });
  }

  return { ...query, counts };
}

export function useAddReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      stationUuid,
      stationName,
      reactionType,
    }: {
      stationUuid: string;
      stationName: string;
      reactionType: ReactionType;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Delete existing reaction for this station by this user
      await supabase
        .from('station_reactions')
        .delete()
        .eq('user_id', user.id)
        .eq('station_uuid', stationUuid);

      // Insert new reaction
      const { data, error } = await supabase
        .from('station_reactions')
        .insert({
          user_id: user.id,
          station_uuid: stationUuid,
          station_name: stationName,
          reaction_type: reactionType,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['station-reactions', variables.stationUuid] });
      queryClient.invalidateQueries({ queryKey: ['trending-stations'] });
      queryClient.invalidateQueries({ queryKey: ['user-station-stats'] });
    },
  });
}

export function useUserReaction(stationUuid: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-reaction', stationUuid, user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('station_reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('station_uuid', stationUuid)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data as StationReaction | null;
    },
    enabled: !!stationUuid && !!user,
  });
}

// Get trending stations based on reactions
export function useTrendingStations(limit = 10) {
  return useQuery({
    queryKey: ['trending-stations', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_reactions')
        .select('station_uuid, station_name')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      // Count reactions per station
      const stationCounts: Record<string, { uuid: string; name: string; count: number }> = {};
      data.forEach((reaction) => {
        if (!stationCounts[reaction.station_uuid]) {
          stationCounts[reaction.station_uuid] = {
            uuid: reaction.station_uuid,
            name: reaction.station_name,
            count: 0,
          };
        }
        stationCounts[reaction.station_uuid].count++;
      });

      // Sort by count and return top stations
      return Object.values(stationCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
    },
    refetchInterval: 30000,
  });
}

// Calculate energy level (0-100) based on recent reactions
export function calculateEnergy(reactions: StationReaction[]): number {
  if (!reactions.length) return 0;

  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const recentReactions = reactions.filter(
    (r) => new Date(r.created_at) > tenMinutesAgo
  );

  // Energy formula: more recent reactions = higher energy
  // Max energy at ~20 reactions in 10 minutes
  const energy = Math.min(100, (recentReactions.length / 20) * 100);
  return Math.round(energy);
}
