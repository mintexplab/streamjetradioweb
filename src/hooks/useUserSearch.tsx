import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserSearchResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export function useUserSearch(query: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      const searchTerm = query.toLowerCase();

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${searchTerm}%,display_name.ilike.%${searchTerm}%`)
        .neq('user_id', user?.id || '')
        .limit(20);

      if (error) throw error;
      return data as UserSearchResult[];
    },
    enabled: query.length >= 2,
  });
}
