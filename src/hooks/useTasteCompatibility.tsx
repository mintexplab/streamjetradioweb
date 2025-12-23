import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserStationStats } from './useUserStationStats';

export interface TasteCompatibility {
  userId: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  compatibilityScore: number;
  sharedStations: string[];
  insights: string[];
}

export function useTasteCompatibility(otherUserId: string) {
  const { user } = useAuth();
  const { data: myStats } = useUserStationStats(user?.id);
  const { data: theirStats } = useUserStationStats(otherUserId);

  if (!myStats || !theirStats || myStats.length === 0 || theirStats.length === 0) {
    return {
      compatibilityScore: 0,
      sharedStations: [],
      insights: [],
    };
  }

  // Find shared stations
  const myStationUuids = new Set(myStats.map(s => s.station_uuid));
  const sharedStations = theirStats
    .filter(s => myStationUuids.has(s.station_uuid))
    .map(s => s.station_name);

  // Calculate compatibility based on shared stations and reaction patterns
  const totalStations = new Set([
    ...myStats.map(s => s.station_uuid),
    ...theirStats.map(s => s.station_uuid),
  ]).size;

  const sharedCount = sharedStations.length;
  const stationScore = Math.min(100, (sharedCount / Math.min(myStats.length, theirStats.length)) * 100);

  // Compare reaction patterns
  const myReactions = {
    fire: myStats.reduce((sum, s) => sum + s.fire_count, 0),
    wave: myStats.reduce((sum, s) => sum + s.wave_count, 0),
    crying: myStats.reduce((sum, s) => sum + s.crying_count, 0),
    sleep: myStats.reduce((sum, s) => sum + s.sleep_count, 0),
  };

  const theirReactions = {
    fire: theirStats.reduce((sum, s) => sum + s.fire_count, 0),
    wave: theirStats.reduce((sum, s) => sum + s.wave_count, 0),
    crying: theirStats.reduce((sum, s) => sum + s.crying_count, 0),
    sleep: theirStats.reduce((sum, s) => sum + s.sleep_count, 0),
  };

  // Normalize and compare
  const myTotal = Object.values(myReactions).reduce((a, b) => a + b, 0) || 1;
  const theirTotal = Object.values(theirReactions).reduce((a, b) => a + b, 0) || 1;

  const reactionDiff = Object.keys(myReactions).reduce((sum, key) => {
    const myPct = myReactions[key as keyof typeof myReactions] / myTotal;
    const theirPct = theirReactions[key as keyof typeof theirReactions] / theirTotal;
    return sum + Math.abs(myPct - theirPct);
  }, 0);

  const reactionScore = Math.max(0, 100 - (reactionDiff * 50));

  // Final compatibility score
  const compatibilityScore = Math.round((stationScore * 0.6) + (reactionScore * 0.4));

  // Generate insights
  const insights: string[] = [];

  if (sharedCount > 0) {
    insights.push(`You both listen to ${sharedStations[0]}`);
  }

  if (sharedCount >= 3) {
    insights.push(`${sharedCount} stations in common`);
  }

  const myTopReaction = Object.entries(myReactions).sort((a, b) => b[1] - a[1])[0];
  const theirTopReaction = Object.entries(theirReactions).sort((a, b) => b[1] - a[1])[0];

  if (myTopReaction[0] === theirTopReaction[0]) {
    const emoji = { fire: '🔥', wave: '🌊', crying: '😭', sleep: '💤' }[myTopReaction[0]];
    insights.push(`Both ${emoji} merchants`);
  }

  return {
    compatibilityScore,
    sharedStations,
    insights,
  };
}

export function useFriendsCompatibility() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['friends-compatibility', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get accepted friendships
      const { data: friendships, error: fError } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (fError) throw fError;

      const friendIds = friendships?.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      ) || [];

      if (friendIds.length === 0) return [];

      // Get profiles
      const { data: profiles, error: pError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', friendIds);

      if (pError) throw pError;

      return profiles || [];
    },
    enabled: !!user,
  });
}
