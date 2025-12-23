import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';
import { createNotification } from './useNotifications';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface FriendWithProfile extends Friendship {
  friend_profile?: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useFriendships() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['friendships', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;
      return data as Friendship[];
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friendships-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'friendships' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['friendships'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return query;
}

export function useFriends() {
  const { user } = useAuth();
  const { data: friendships } = useFriendships();

  return useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user || !friendships) return [];

      const acceptedFriendships = friendships.filter(f => f.status === 'accepted');
      const friendIds = acceptedFriendships.map(f => 
        f.requester_id === user.id ? f.addressee_id : f.requester_id
      );

      if (friendIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', friendIds);

      if (error) throw error;
      return data;
    },
    enabled: !!user && !!friendships,
  });
}

export function usePendingFriendRequests() {
  const { user } = useAuth();
  const { data: friendships } = useFriendships();

  return useQuery({
    queryKey: ['friend-requests', user?.id],
    queryFn: async () => {
      if (!user || !friendships) return [];

      const pending = friendships.filter(
        f => f.status === 'pending' && f.addressee_id === user.id
      );
      
      const requesterIds = pending.map(f => f.requester_id);
      if (requesterIds.length === 0) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', requesterIds);

      if (error) throw error;
      
      return pending.map(f => ({
        ...f,
        friend_profile: data?.find(p => p.user_id === f.requester_id),
      })) as FriendWithProfile[];
    },
    enabled: !!user && !!friendships,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (addresseeId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Get requester's profile for notification
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('user_id', user.id)
        .single();

      const senderName = profile?.display_name || profile?.username || 'Someone';

      // Send notification to addressee
      await createNotification(
        addresseeId,
        'friend_request',
        'New friend request',
        `${senderName} wants to be your friend`,
        { requester_id: user.id }
      );

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      friendshipId, 
      accept 
    }: { 
      friendshipId: string; 
      accept: boolean;
    }) => {
      const { data, error } = await supabase
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', friendshipId)
        .select()
        .single();

      if (error) throw error;

      // If accepted, notify the requester
      if (accept && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('user_id', user.id)
          .single();

        const accepterName = profile?.display_name || profile?.username || 'Someone';

        await createNotification(
          data.requester_id,
          'friend_accepted',
          'Friend request accepted!',
          `${accepterName} accepted your friend request`,
          { friend_id: user.id }
        );
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendshipId: string) => {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

// Check if two users are friends
export function useFriendshipStatus(otherUserId: string) {
  const { user } = useAuth();
  const { data: friendships } = useFriendships();

  if (!user || !friendships || !otherUserId) {
    return { isFriend: false, isPending: false, friendship: null };
  }

  const friendship = friendships.find(
    f => (f.requester_id === otherUserId || f.addressee_id === otherUserId)
  );

  return {
    isFriend: friendship?.status === 'accepted',
    isPending: friendship?.status === 'pending',
    isRequester: friendship?.requester_id === user.id,
    friendship,
  };
}
