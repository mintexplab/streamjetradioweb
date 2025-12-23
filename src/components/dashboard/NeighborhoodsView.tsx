import React from 'react';
import { Users, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useNeighborhoods, 
  useUserNeighborhoods, 
  useNeighborhoodMembers,
  Neighborhood 
} from '@/hooks/useNeighborhoods';
import { Link } from 'react-router-dom';

function NeighborhoodCard({ neighborhood }: { neighborhood: Neighborhood }) {
  const { data: members, isLoading } = useNeighborhoodMembers(neighborhood.id);

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          {neighborhood.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">
          {neighborhood.description}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {neighborhood.vibe_tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {isLoading ? (
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-6 rounded-full" />
            ))}
          </div>
        ) : members && members.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((member) => (
                <Link 
                  key={member.user_id} 
                  to={`/profile/${member.profile?.username || member.user_id}`}
                >
                  <Avatar className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {member.profile?.display_name?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {members.length} {members.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No members yet</p>
        )}
      </CardContent>
    </Card>
  );
}

export function NeighborhoodsView() {
  const { data: neighborhoods, isLoading: loadingNeighborhoods } = useNeighborhoods();
  const { data: userNeighborhoods, isLoading: loadingUserNeighborhoods } = useUserNeighborhoods();

  if (loadingNeighborhoods || loadingUserNeighborhoods) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const myNeighborhoodIds = new Set(userNeighborhoods?.map(un => un.neighborhood_id) || []);
  const myNeighborhoods = neighborhoods?.filter(n => myNeighborhoodIds.has(n.id)) || [];
  const otherNeighborhoods = neighborhoods?.filter(n => !myNeighborhoodIds.has(n.id)) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Neighborhoods</h2>
      </div>

      <p className="text-muted-foreground">
        Micro-communities that form naturally based on your listening patterns. 
        Keep listening to discover where you belong.
      </p>

      {myNeighborhoods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Your Neighborhoods
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myNeighborhoods.map((neighborhood) => (
              <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
            ))}
          </div>
        </div>
      )}

      {otherNeighborhoods.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Discover Neighborhoods</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNeighborhoods.map((neighborhood) => (
              <NeighborhoodCard key={neighborhood.id} neighborhood={neighborhood} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
