import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRef, useEffect } from 'react';

export interface ListeningSession {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
}

export interface StationAffinity {
  station_uuid: string;
  station_name: string;
  total_minutes: number;
  session_count: number;
  last_listened: string;
}

export function useListeningSessions(userId?: string, days = 30) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['listening-sessions', targetUserId, days],
    queryFn: async () => {
      if (!targetUserId) return [];

      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from('listening_sessions')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('started_at', since.toISOString())
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data as ListeningSession[];
    },
    enabled: !!targetUserId,
  });
}

export function useStationAffinity(userId?: string) {
  const { data: sessions } = useListeningSessions(userId, 90);

  if (!sessions) return [];

  const affinityMap = new Map<string, StationAffinity>();

  sessions.forEach(session => {
    const existing = affinityMap.get(session.station_uuid);
    const minutes = Math.round(session.duration_seconds / 60);

    if (existing) {
      existing.total_minutes += minutes;
      existing.session_count += 1;
      if (new Date(session.started_at) > new Date(existing.last_listened)) {
        existing.last_listened = session.started_at;
      }
    } else {
      affinityMap.set(session.station_uuid, {
        station_uuid: session.station_uuid,
        station_name: session.station_name,
        total_minutes: minutes,
        session_count: 1,
        last_listened: session.started_at,
      });
    }
  });

  return Array.from(affinityMap.values())
    .sort((a, b) => b.total_minutes - a.total_minutes);
}

export function useTemporalStats(userId?: string) {
  const { data: sessions } = useListeningSessions(userId, 90);

  if (!sessions || sessions.length === 0) {
    return {
      byHour: [],
      byDay: [],
      nightOwlIndex: 0,
      weekendWarrior: false,
      peakHour: null,
    };
  }

  // Calculate by hour
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);

  sessions.forEach(session => {
    const date = new Date(session.started_at);
    const hour = date.getHours();
    const day = date.getDay();
    const minutes = Math.round(session.duration_seconds / 60);

    hourCounts[hour] += minutes;
    dayCounts[day] += minutes;
  });

  // Night owl index (listening between 10pm - 4am vs daytime)
  const nightMinutes = hourCounts.slice(22).reduce((a, b) => a + b, 0) + 
                       hourCounts.slice(0, 4).reduce((a, b) => a + b, 0);
  const dayMinutes = hourCounts.slice(8, 18).reduce((a, b) => a + b, 0);
  const nightOwlIndex = dayMinutes > 0 ? Math.round((nightMinutes / dayMinutes) * 100) : 0;

  // Weekend vs weekday
  const weekendMinutes = dayCounts[0] + dayCounts[6];
  const weekdayMinutes = dayCounts.slice(1, 6).reduce((a, b) => a + b, 0);
  const weekendWarrior = weekendMinutes > weekdayMinutes * 0.4;

  // Peak hour
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    byHour: hourCounts.map((minutes, hour) => ({ hour, minutes })),
    byDay: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => ({
      day,
      minutes: dayCounts[i],
    })),
    nightOwlIndex,
    weekendWarrior,
    peakHour,
  };
}

export function useStartListeningSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      stationUuid, 
      stationName 
    }: { 
      stationUuid: string; 
      stationName: string;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('listening_sessions')
        .insert({
          user_id: user.id,
          station_uuid: stationUuid,
          station_name: stationName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listening-sessions'] });
    },
  });
}

export function useEndListeningSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      durationSeconds 
    }: { 
      sessionId: string; 
      durationSeconds: number;
    }) => {
      const { data, error } = await supabase
        .from('listening_sessions')
        .update({
          ended_at: new Date().toISOString(),
          duration_seconds: durationSeconds,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listening-sessions'] });
    },
  });
}

// Hook to track listening session automatically
export function useListeningTracker(stationUuid: string | undefined, stationName: string | undefined) {
  const { user } = useAuth();
  const startSession = useStartListeningSession();
  const endSession = useEndListeningSession();
  const sessionRef = useRef<{ id: string; startTime: number } | null>(null);

  useEffect(() => {
    if (!user || !stationUuid || !stationName) return;

    // Start session
    startSession.mutateAsync({ stationUuid, stationName }).then(session => {
      sessionRef.current = { id: session.id, startTime: Date.now() };
    });

    return () => {
      // End session on cleanup
      if (sessionRef.current) {
        const duration = Math.round((Date.now() - sessionRef.current.startTime) / 1000);
        endSession.mutate({ sessionId: sessionRef.current.id, durationSeconds: duration });
        sessionRef.current = null;
      }
    };
  }, [stationUuid, user?.id]);
}
