import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useFollows(userId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['follows', userId],
    queryFn: async () => {
      if (!userId) return { isFollowing: false, followerCount: 0, followingCount: 0 };

      const [
        { count: followerCount },
        { count: followingCount },
        { data: followRow },
      ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        user
          ? supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        isFollowing: !!followRow,
        followerCount: followerCount || 0,
        followingCount: followingCount || 0,
      };
    },
    enabled: !!userId,
  });
}

export function useToggleFollow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', userId);
      } else {
        await supabase.from('follows').insert({ follower_id: user.id, following_id: userId });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['follows', vars.userId] });
      queryClient.invalidateQueries({ queryKey: ['follows', user?.id] });
    },
  });
}
