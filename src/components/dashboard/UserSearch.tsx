import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useFollows, useToggleFollow } from '@/hooks/useFollows';
import { useActiveListeners } from '@/hooks/useActiveListeners';
import { useI18n } from '@/hooks/useI18n';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, User, UserPlus, UserCheck, MessageCircle, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function UserSearch() {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useUserSearch(query);
  const { t } = useI18n();

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold">{t('people')}</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchUsers')}
          className="pl-10"
        />
      </div>

      {query.length >= 2 && (
        <div className="space-y-2 animate-fade-in">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))
          ) : results && results.length > 0 ? (
            results.map((user) => (
              <UserSearchResult key={user.user_id} user={user} />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm animate-fade-in">
              {t('noResults')}
            </div>
          )}
        </div>
      )}

      {query.length < 2 && (
        <div className="text-center py-16 text-muted-foreground text-sm animate-fade-in">
          <User className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>{t('searchUsers')}</p>
        </div>
      )}
    </div>
  );
}

function UserSearchResult({ user }: { user: { user_id: string; username: string | null; display_name: string | null; avatar_url: string | null } }) {
  const { data: followData } = useFollows(user.user_id);
  const toggleFollow = useToggleFollow();
  const { toast } = useToast();
  const { t } = useI18n();

  // Check if user is currently listening
  const { data: listeners } = useUserListeningStatus(user.user_id);

  const handleFollow = async () => {
    try {
      await toggleFollow.mutateAsync({ userId: user.user_id, isFollowing: followData?.isFollowing || false });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <Card className="hover:bg-accent/40 transition-colors animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Link to={user.username ? `/profile/@${user.username}` : '#'}>
            <Avatar className="w-12 h-12">
              <AvatarImage src={user.avatar_url || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="w-6 h-6" />
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link
              to={user.username ? `/profile/@${user.username}` : '#'}
              className="font-semibold text-sm hover:text-primary transition-colors block truncate"
            >
              {user.display_name || user.username || 'Anonymous'}
            </Link>
            {user.username && (
              <span className="text-xs text-muted-foreground">@{user.username}</span>
            )}
            {listeners && listeners.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <Radio className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-xs text-primary font-medium truncate">
                  {t('listeningTo')} {listeners[0].station_name}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Link to={user.username ? `/profile/@${user.username}?dm=true` : '#'}>
              <Button variant="outline" size="icon" className="w-9 h-9">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant={followData?.isFollowing ? 'secondary' : 'default'}
              size="sm"
              onClick={handleFollow}
              disabled={toggleFollow.isPending}
              className="text-xs"
            >
              {followData?.isFollowing ? (
                <><UserCheck className="w-3.5 h-3.5 mr-1" /> {t('following')}</>
              ) : (
                <><UserPlus className="w-3.5 h-3.5 mr-1" /> {t('follow')}</>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function useUserListeningStatus(userId: string) {
  return useQuery({
    queryKey: ['user-listening', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('active_listeners')
        .select('station_name, station_uuid')
        .eq('user_id', userId)
        .gte('last_heartbeat', new Date(Date.now() - 2 * 60 * 1000).toISOString());

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    refetchInterval: 30000,
  });
}
