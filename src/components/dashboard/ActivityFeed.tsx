import { useFriends } from '@/hooks/useFriendships';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Radio, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ListeningActivity {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  station_name: string;
  station_uuid: string;
}

export function ActivityFeed() {
  const { data: friends } = useFriends();

  const { data: activity, isLoading } = useQuery({
    queryKey: ['friend-activity', friends?.map(f => f.user_id)],
    queryFn: async () => {
      if (!friends || friends.length === 0) return [];

      const friendIds = friends.map(f => f.user_id);

      // Get active listeners who are friends
      const { data, error } = await supabase
        .from('active_listeners')
        .select('user_id, station_name, station_uuid')
        .in('user_id', friendIds);

      if (error) throw error;

      // Map with profile info
      return data.map(listener => {
        const friend = friends.find(f => f.user_id === listener.user_id);
        return {
          ...listener,
          username: friend?.username,
          display_name: friend?.display_name,
          avatar_url: friend?.avatar_url,
        } as ListeningActivity;
      });
    },
    enabled: !!friends && friends.length > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Group by station
  const stationGroups = activity?.reduce((acc, item) => {
    if (!acc[item.station_uuid]) {
      acc[item.station_uuid] = {
        station_name: item.station_name,
        station_uuid: item.station_uuid,
        listeners: [],
      };
    }
    acc[item.station_uuid].listeners.push(item);
    return acc;
  }, {} as Record<string, { station_name: string; station_uuid: string; listeners: ListeningActivity[] }>);

  const groupedActivity = stationGroups ? Object.values(stationGroups) : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Friend Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Add friends to see what they're listening to!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friend Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!activity || activity.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            None of your friends are listening right now
          </p>
        ) : (
          <div className="space-y-4">
            {/* Grouped by station */}
            {groupedActivity.map((group) => (
              <div key={group.station_uuid} className="space-y-2">
                {group.listeners.length > 1 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Radio className="w-4 h-4 text-primary" />
                    <span>
                      {group.listeners.length} friends tuned into{' '}
                      <span className="font-medium text-foreground">{group.station_name}</span>
                    </span>
                  </div>
                ) : null}

                {group.listeners.map((listener) => (
                  <div 
                    key={listener.user_id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Link to={listener.username ? `/profile/@${listener.username}` : '#'}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={listener.avatar_url || ''} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <Link 
                          to={listener.username ? `/profile/@${listener.username}` : '#'}
                          className="font-medium hover:underline"
                        >
                          {listener.display_name || listener.username || 'Friend'}
                        </Link>
                        {' '}is listening to{' '}
                        <Link 
                          to={`/station/${listener.station_uuid}`}
                          className="text-primary hover:underline"
                        >
                          {listener.station_name}
                        </Link>
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
