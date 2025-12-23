import { useFriends, usePendingFriendRequests, useRespondToFriendRequest } from '@/hooks/useFriendships';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Check, X, Heart, Music, Radio, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTasteCompatibility } from '@/hooks/useTasteCompatibility';
import { useMusicIdentityCompatibility, useFavoriteArtists } from '@/hooks/useMusicIdentity';
import { useActiveListeners } from '@/hooks/useActiveListeners';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function FriendsList() {
  const { data: friends, isLoading } = useFriends();
  const { data: pendingRequests } = usePendingFriendRequests();
  const respondToRequest = useRespondToFriendRequest();
  const { toast } = useToast();

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    try {
      await respondToRequest.mutateAsync({ friendshipId, accept });
      toast({ title: accept ? 'Friend request accepted!' : 'Friend request declined' });
    } catch {
      toast({ title: 'Something went wrong', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              Friend Requests
              <Badge variant="secondary">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingRequests.map((request) => (
              <div key={request.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={request.friend_profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {request.friend_profile?.display_name || request.friend_profile?.username || 'Anonymous'}
                  </p>
                  {request.friend_profile?.username && (
                    <p className="text-sm text-muted-foreground">@{request.friend_profile.username}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleRespond(request.id, true)}
                    disabled={respondToRequest.isPending}
                  >
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleRespond(request.id, false)}
                    disabled={respondToRequest.isPending}
                  >
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Friends list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            Your Friends {friends && friends.length > 0 && `(${friends.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!friends || friends.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No friends yet. Search for users to add friends!
            </p>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <FriendCard key={friend.user_id} friend={friend} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FriendCard({ friend }: { friend: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null; is_verified?: boolean } }) {
  const { compatibilityScore: stationScore, sharedStations, insights: stationInsights } = useTasteCompatibility(friend.user_id);
  const { score: musicScore, sharedArtists } = useMusicIdentityCompatibility(friend.user_id);

  // Check if friend is currently listening
  const { data: listeningActivity } = useQuery({
    queryKey: ['friend-listening', friend.user_id],
    queryFn: async () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('active_listeners')
        .select('station_name, station_uuid')
        .eq('user_id', friend.user_id)
        .gt('last_heartbeat', twoMinutesAgo)
        .single();
      return data;
    },
    refetchInterval: 30000,
  });

  // Combined score
  const hasStationData = stationScore > 0;
  const hasMusicData = musicScore > 0;
  let combinedScore = 0;
  if (hasStationData && hasMusicData) {
    combinedScore = Math.round((stationScore * 0.5) + (musicScore * 0.5));
  } else if (hasStationData) {
    combinedScore = stationScore;
  } else if (hasMusicData) {
    combinedScore = musicScore;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-primary bg-primary/10';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
      <Link to={friend.username ? `/profile/@${friend.username}` : '#'} className="relative">
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar_url || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
        {listeningActivity && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
            <Radio className="w-2 h-2 text-white" />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <Link 
          to={friend.username ? `/profile/@${friend.username}` : '#'}
          className="font-semibold hover:underline flex items-center gap-1 truncate"
        >
          {friend.display_name || friend.username || 'Anonymous'}
          {friend.is_verified && (
            <BadgeCheck className="w-4 h-4 text-primary fill-primary/20 flex-shrink-0" />
          )}
        </Link>
        {friend.username && (
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        )}
        
        {/* Currently listening */}
        {listeningActivity && (
          <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
            <Radio className="w-3 h-3" />
            Listening to {listeningActivity.station_name}
          </p>
        )}

        {/* Insights */}
        {!listeningActivity && (stationInsights.length > 0 || sharedArtists.length > 0) && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {sharedArtists.length > 0 
              ? `${sharedArtists.length} shared artist${sharedArtists.length > 1 ? 's' : ''}` 
              : stationInsights[0]
            }
          </p>
        )}
      </div>

      {/* Compatibility badges */}
      <div className="flex flex-col items-end gap-1">
        {combinedScore > 0 && (
          <Badge variant="secondary" className={`${getScoreColor(combinedScore)} border-0`}>
            <Heart className="w-3 h-3 mr-1" />
            {combinedScore}%
          </Badge>
        )}
        {sharedArtists.length > 0 && (
          <div className="flex -space-x-1">
            {sharedArtists.slice(0, 3).map((artist) => (
              <Avatar key={artist.id} className="h-5 w-5 border border-background">
                <AvatarImage src={artist.artist_image || undefined} />
                <AvatarFallback className="text-[8px]">{artist.artist_name[0]}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
