import React from 'react';
import { Link } from 'react-router-dom';
import { Music, Mic, Guitar, Disc } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoriteArtists, useFavoriteTracks, useUserMusicRoles } from '@/hooks/useMusicIdentity';

interface ProfileMusicIdentityProps {
  userId: string;
  compact?: boolean;
}

export function ProfileMusicIdentity({ userId, compact = false }: ProfileMusicIdentityProps) {
  const { data: artists, isLoading: loadingArtists } = useFavoriteArtists(userId);
  const { data: tracks, isLoading: loadingTracks } = useFavoriteTracks(userId);
  const { data: roles, isLoading: loadingRoles } = useUserMusicRoles(userId);

  const instruments = roles?.filter(r => r.role_type === 'instrument') || [];
  const musicRoles = roles?.filter(r => r.role_type === 'role') || [];

  const isLoading = loadingArtists || loadingTracks || loadingRoles;
  const hasContent = (artists?.length || 0) > 0 || (tracks?.length || 0) > 0 || (roles?.length || 0) > 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasContent) {
    return null;
  }

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Music className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Music Identity</span>
          </div>
          
          {/* Artists in compact view */}
          {artists && artists.length > 0 && (
            <div className="flex -space-x-2 mb-2">
              {artists.slice(0, 5).map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.artist_id}`}>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={artist.artist_image || undefined} />
                    <AvatarFallback className="text-xs">{artist.artist_name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              ))}
              {artists.length > 5 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                  +{artists.length - 5}
                </div>
              )}
            </div>
          )}

          {/* Roles badges */}
          {roles && roles.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {roles.slice(0, 3).map((role) => (
                <Badge key={role.id} variant="outline" className="text-xs">
                  {role.role_type === 'instrument' ? <Guitar className="w-2 h-2 mr-1" /> : <Mic className="w-2 h-2 mr-1" />}
                  {role.role_name}
                </Badge>
              ))}
              {roles.length > 3 && (
                <Badge variant="outline" className="text-xs">+{roles.length - 3}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Favorite Artists */}
      {artists && artists.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Music className="w-5 h-5" />
              Favorite Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {artists.slice(0, 8).map((artist, index) => (
                <Link 
                  key={artist.id} 
                  to={`/artist/${artist.artist_id}`}
                  className="text-center group"
                >
                  <Avatar className="h-14 w-14 mx-auto mb-1 group-hover:ring-2 ring-primary transition-all">
                    <AvatarImage src={artist.artist_image || undefined} />
                    <AvatarFallback>{artist.artist_name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-medium truncate">{artist.artist_name}</p>
                  <p className="text-xs text-muted-foreground">#{index + 1}</p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Favorite Tracks */}
      {tracks && tracks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Disc className="w-5 h-5" />
              Favorite Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tracks.slice(0, 5).map((track, index) => (
                <div key={track.id} className="flex items-center gap-3">
                  <span className="w-5 text-muted-foreground text-sm font-medium">{index + 1}</span>
                  {track.track_image ? (
                    <img 
                      src={track.track_image} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <Disc className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.track_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instruments & Roles */}
      {roles && roles.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Guitar className="w-5 h-5" />
              Music Background
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {instruments.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Instruments</p>
                <div className="flex flex-wrap gap-2">
                  {instruments.map((inst) => (
                    <Badge key={inst.id} variant="secondary">
                      {inst.role_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {musicRoles.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Roles</p>
                <div className="flex flex-wrap gap-2">
                  {musicRoles.map((role) => (
                    <Badge key={role.id} variant="outline">
                      {role.role_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
