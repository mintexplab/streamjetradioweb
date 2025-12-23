import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useFriends } from './useFriendships';
import { createNotification } from './useNotifications';

// Track friend listening activity and send notifications
export function useFriendListeningNotifications() {
  const { user } = useAuth();
  const { data: friends } = useFriends();
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !friends || friends.length === 0) return;

    const friendIds = friends.map(f => f.user_id);

    // Subscribe to active_listeners changes for friends
    const channel = supabase
      .channel('friend-listening-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'active_listeners',
        },
        async (payload) => {
          const listener = payload.new as {
            user_id: string;
            station_name: string;
            station_uuid: string;
          };

          // Check if this is a friend and we haven't notified about this session
          if (friendIds.includes(listener.user_id)) {
            const notificationKey = `${listener.user_id}-${listener.station_uuid}`;
            
            // Don't notify if we already have in the last 5 minutes
            if (notifiedRef.current.has(notificationKey)) return;
            
            notifiedRef.current.add(notificationKey);
            
            // Clear after 5 minutes to allow new notifications
            setTimeout(() => {
              notifiedRef.current.delete(notificationKey);
            }, 5 * 60 * 1000);

            // Get friend profile
            const friend = friends.find(f => f.user_id === listener.user_id);
            const friendName = friend?.display_name || friend?.username || 'A friend';

            // Create notification for current user
            await createNotification(
              user.id,
              'friend_listening',
              `${friendName} started listening`,
              `Tuned into ${listener.station_name}`,
              { 
                friend_id: listener.user_id,
                station_uuid: listener.station_uuid,
                station_name: listener.station_name 
              }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friends]);
}
