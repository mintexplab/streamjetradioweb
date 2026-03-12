import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export function useConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get all messages involving this user
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by conversation partner
      const convMap = new Map<string, DirectMessage>();
      for (const msg of (data || [])) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!convMap.has(partnerId)) convMap.set(partnerId, msg);
      }

      // Fetch partner profiles
      const partnerIds = Array.from(convMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', partnerIds);

      return partnerIds.map(pid => ({
        partnerId: pid,
        lastMessage: convMap.get(pid)!,
        profile: profiles?.find(p => p.user_id === pid),
      }));
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dm-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        queryClient.invalidateQueries({ queryKey: ['dm-thread'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return query;
}

export function useDirectMessages(partnerId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['dm-thread', user?.id, partnerId],
    queryFn: async () => {
      if (!user || !partnerId) return [];

      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Mark received messages as read
      await supabase
        .from('direct_messages')
        .update({ read: true })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      return data as DirectMessage[];
    },
    enabled: !!user && !!partnerId,
    refetchInterval: 5000,
  });
}

export function useSendDM() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: user.id, receiver_id: receiverId, content })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['dm-thread'] });
    },
  });
}
