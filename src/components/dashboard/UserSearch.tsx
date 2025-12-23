import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useFriendshipStatus, useSendFriendRequest } from '@/hooks/useFriendships';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, UserPlus, Check, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useUserSearch(query);
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users by name or username..."
          className="pl-10"
        />
      </div>

      {query.length >= 2 && (
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))
          ) : results && results.length > 0 ? (
            results.map((user) => (
              <UserSearchResult key={user.user_id} user={user} />
            ))
          ) : (
            <Card>
              <CardContent className="p-4 text-center text-muted-foreground">
                No users found matching "{query}"
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function UserSearchResult({ user }: { user: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null } }) {
  const { isFriend, isPending, isRequester } = useFriendshipStatus(user.user_id);
  const sendRequest = useSendFriendRequest();
  const { toast } = useToast();

  const handleAddFriend = async () => {
    try {
      await sendRequest.mutateAsync(user.user_id);
      toast({ title: 'Friend request sent!' });
    } catch {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
  };

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={user.username ? `/profile/@${user.username}` : '#'}>
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link 
              to={user.username ? `/profile/@${user.username}` : '#'}
              className="font-semibold hover:underline block truncate"
            >
              {user.display_name || user.username || 'Anonymous'}
            </Link>
            {user.username && (
              <span className="text-sm text-muted-foreground">@{user.username}</span>
            )}
          </div>

          {isFriend ? (
            <Button variant="outline" size="sm" disabled>
              <Check className="w-4 h-4 mr-2" />
              Friends
            </Button>
          ) : isPending ? (
            <Button variant="outline" size="sm" disabled>
              <Clock className="w-4 h-4 mr-2" />
              {isRequester ? 'Request Sent' : 'Pending'}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAddFriend}
              disabled={sendRequest.isPending}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Friend
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
