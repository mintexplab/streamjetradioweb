import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ChatMessage {
  id: string;
  station_uuid: string;
  station_name: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export function useStationChat(stationUuid: string, stationName: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch messages for the station
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['station-chat', stationUuid],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_chat_messages')
        .select('*')
        .eq('station_uuid', stationUuid)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data.map(m => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(msg => ({
        ...msg,
        profile: profileMap.get(msg.user_id) || null,
      })) as ChatMessage[];
    },
    enabled: !!stationUuid,
    refetchInterval: false,
  });

  // Subscribe to new messages
  useEffect(() => {
    if (!stationUuid) return;

    const channel = supabase
      .channel(`station-chat-${stationUuid}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'station_chat_messages',
          filter: `station_uuid=eq.${stationUuid}`,
        },
        async (payload) => {
          const newMessage = payload.new as ChatMessage;
          
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .eq('user_id', newMessage.user_id)
            .single();

          const messageWithProfile = {
            ...newMessage,
            profile: profile || null,
          };

          queryClient.setQueryData(['station-chat', stationUuid], (old: ChatMessage[] = []) => {
            if (old.some(m => m.id === newMessage.id)) return old;
            return [...old, messageWithProfile];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'station_chat_messages',
          filter: `station_uuid=eq.${stationUuid}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          queryClient.setQueryData(['station-chat', stationUuid], (old: ChatMessage[] = []) =>
            old.filter(m => m.id !== deletedId)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stationUuid, queryClient]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('station_chat_messages').insert({
        station_uuid: stationUuid,
        station_name: stationName,
        user_id: user.id,
        content,
      });

      if (error) throw error;
    },
  });

  // Delete message mutation
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('station_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
  });

  return {
    messages,
    isLoading,
    sendMessage: sendMessage.mutate,
    deleteMessage: deleteMessage.mutate,
    isSending: sendMessage.isPending,
  };
}
