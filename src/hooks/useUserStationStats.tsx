import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { ReactionType } from './useReactions';

interface UserStationStats {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  fire_count: number;
  wave_count: number;
  crying_count: number;
  sleep_count: number;
  total_listen_time: number;
  last_listened_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserStationStats(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-station-stats', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_station_stats')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as UserStationStats[];
    },
    enabled: !!targetUserId,
  });
}

export function useUpdateStationStats() {
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

      // Get existing stats
      const { data: existing } = await supabase
        .from('user_station_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('station_uuid', stationUuid)
        .maybeSingle();

      const reactionField = `${reactionType}_count` as const;

      if (existing) {
        // Update existing stats
        const { error } = await supabase
          .from('user_station_stats')
          .update({
            [reactionField]: (existing[reactionField] || 0) + 1,
            last_listened_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new stats
        const { error } = await supabase
          .from('user_station_stats')
          .insert({
            user_id: user.id,
            station_uuid: stationUuid,
            station_name: stationName,
            [reactionField]: 1,
            last_listened_at: new Date().toISOString(),
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-station-stats'] });
    },
  });
}

// Get user's reaction personality (most used reaction type)
export function getReactionPersonality(stats: UserStationStats[]): {
  type: ReactionType | null;
  label: string;
  emoji: string;
} {
  if (!stats.length) return { type: null, label: 'New Listener', emoji: '🎧' };

  const totals = {
    fire: stats.reduce((sum, s) => sum + s.fire_count, 0),
    wave: stats.reduce((sum, s) => sum + s.wave_count, 0),
    crying: stats.reduce((sum, s) => sum + s.crying_count, 0),
    sleep: stats.reduce((sum, s) => sum + s.sleep_count, 0),
  };

  const max = Object.entries(totals).reduce((a, b) => (a[1] > b[1] ? a : b));

  const personalities: Record<ReactionType, { label: string; emoji: string }> = {
    fire: { label: '🔥 Fire Merchant', emoji: '🔥' },
    wave: { label: '🌊 Vibe Curator', emoji: '🌊' },
    crying: { label: '😭 Emotional Explorer', emoji: '😭' },
    sleep: { label: '💤 Honest Critic', emoji: '💤' },
  };

  if (max[1] === 0) return { type: null, label: 'New Listener', emoji: '🎧' };

  return {
    type: max[0] as ReactionType,
    ...personalities[max[0] as ReactionType],
  };
}

// Get top stations for a user
export function getTopStations(stats: UserStationStats[], limit = 5) {
  return [...stats]
    .sort((a, b) => {
      const aTotal = a.fire_count + a.wave_count + a.crying_count + a.sleep_count;
      const bTotal = b.fire_count + b.wave_count + b.crying_count + b.sleep_count;
      return bTotal - aTotal;
    })
    .slice(0, limit);
}
