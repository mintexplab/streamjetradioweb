import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Neighborhood {
  id: string;
  name: string;
  description: string | null;
  vibe_tags: string[];
  created_at: string;
}

export interface UserNeighborhood {
  id: string;
  user_id: string;
  neighborhood_id: string;
  affinity_score: number;
  joined_at: string;
  neighborhood?: Neighborhood;
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('neighborhoods')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Neighborhood[];
    },
  });
}

export function useUserNeighborhoods(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  return useQuery({
    queryKey: ['user-neighborhoods', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('user_neighborhoods')
        .select('*, neighborhoods(*)')
        .eq('user_id', targetUserId)
        .order('affinity_score', { ascending: false });

      if (error) throw error;
      
      return data.map(un => ({
        ...un,
        neighborhood: un.neighborhoods as unknown as Neighborhood,
      })) as UserNeighborhood[];
    },
    enabled: !!targetUserId,
  });
}

export function useNeighborhoodMembers(neighborhoodId: string) {
  return useQuery({
    queryKey: ['neighborhood-members', neighborhoodId],
    queryFn: async () => {
      const { data: memberships, error: memberError } = await supabase
        .from('user_neighborhoods')
        .select('user_id, affinity_score')
        .eq('neighborhood_id', neighborhoodId)
        .order('affinity_score', { ascending: false })
        .limit(50);

      if (memberError) throw memberError;
      if (!memberships || memberships.length === 0) return [];

      const userIds = memberships.map(m => m.user_id);
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      if (profileError) throw profileError;

      return memberships.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id),
      }));
    },
    enabled: !!neighborhoodId,
  });
}

export function useUpdateNeighborhoodAffinity() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ neighborhoodId, affinityScore }: { neighborhoodId: string; affinityScore: number }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_neighborhoods')
        .upsert({
          user_id: user.id,
          neighborhood_id: neighborhoodId,
          affinity_score: affinityScore,
        }, {
          onConflict: 'user_id,neighborhood_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-neighborhoods'] });
    },
  });
}

// Auto-assign neighborhoods based on listening patterns
export function useAutoAssignNeighborhoods() {
  const { user } = useAuth();
  const updateAffinity = useUpdateNeighborhoodAffinity();
  const { data: neighborhoods } = useNeighborhoods();

  const assignBasedOnListening = async (stationTags: string[], listeningHour: number) => {
    if (!user || !neighborhoods) return;

    const tagSet = new Set(stationTags.map(t => t.toLowerCase()));

    // Check for time-based neighborhoods
    if (listeningHour >= 0 && listeningHour < 6) {
      const nightOwls = neighborhoods.find(n => n.name === 'Night Owls');
      if (nightOwls) {
        updateAffinity.mutate({ neighborhoodId: nightOwls.id, affinityScore: 10 });
      }
    } else if (listeningHour >= 6 && listeningHour < 10) {
      const morning = neighborhoods.find(n => n.name === 'Morning Commuters');
      if (morning) {
        updateAffinity.mutate({ neighborhoodId: morning.id, affinityScore: 10 });
      }
    }

    // Check for genre-based neighborhoods
    for (const neighborhood of neighborhoods) {
      const matchingTags = neighborhood.vibe_tags.filter(vt => 
        tagSet.has(vt.toLowerCase())
      );
      
      if (matchingTags.length > 0) {
        const score = matchingTags.length * 5;
        updateAffinity.mutate({ neighborhoodId: neighborhood.id, affinityScore: score });
      }
    }
  };

  return { assignBasedOnListening };
}
