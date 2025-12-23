import { useFriends, usePendingFriendRequests, useRespondToFriendRequest, useRemoveFriend } from '@/hooks/useFriendships';
import { useTasteCompatibility } from '@/hooks/useTasteCompatibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { User, Check, X, UserMinus, Percent } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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

function FriendCard({ friend }: { friend: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null } }) {
  const { compatibilityScore, insights } = useTasteCompatibility(friend.user_id);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Link to={friend.username ? `/profile/@${friend.username}` : '#'}>
        <Avatar className="w-12 h-12">
          <AvatarImage src={friend.avatar_url || ''} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="w-6 h-6" />
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link 
          to={friend.username ? `/profile/@${friend.username}` : '#'}
          className="font-semibold hover:underline block truncate"
        >
          {friend.display_name || friend.username || 'Anonymous'}
        </Link>
        {friend.username && (
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        )}
        {insights.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {insights[0]}
          </p>
        )}
      </div>

      {compatibilityScore > 0 && (
        <Badge variant="secondary" className="shrink-0">
          <Percent className="w-3 h-3 mr-1" />
          {compatibilityScore}% match
        </Badge>
      )}
    </div>
  );
}
