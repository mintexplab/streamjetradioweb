import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Globe, Music, Disc, Users, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useArtistDetails, useArtistDiscography } from '@/hooks/useAudioDB';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export default function ArtistPage() {
  const { artistId } = useParams<{ artistId: string }>();
  const { data: artist, isLoading: loadingArtist } = useArtistDetails(artistId || '');
  const { data: discography, isLoading: loadingDiscography } = useArtistDiscography(artistId || '');

  // Get users who favorited this artist
  const { data: fans } = useQuery({
    queryKey: ['artist-fans', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data: favorites, error } = await supabase
        .from('favorite_artists')
        .select('user_id')
        .eq('artist_id', artistId)
        .limit(20);

      if (error) throw error;
      if (!favorites || favorites.length === 0) return [];

      const userIds = favorites.map(f => f.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      return profiles || [];
    },
    enabled: !!artistId,
  });

  if (loadingArtist) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Skeleton className="h-8 w-24" />
        <div className="flex gap-6">
          <Skeleton className="h-48 w-48 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="container max-w-4xl py-8">
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="text-center py-12">
          <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Artist not found</h1>
        </div>
      </div>
    );
  }

  const biography = artist.strBiographyEN || artist.strBiographyDE || artist.strBiographyFR || '';
  const truncatedBio = biography.length > 500 ? biography.slice(0, 500) + '...' : biography;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Link to="/dashboard">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </Link>

      {/* Artist Header */}
      <div className="flex flex-col md:flex-row gap-6">
        {artist.strArtistThumb && (
          <img 
            src={artist.strArtistThumb} 
            alt={artist.strArtist}
            className="w-48 h-48 object-cover rounded-lg shadow-lg"
          />
        )}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold">{artist.strArtist}</h1>
            {artist.strCountry && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <Globe className="h-4 w-4" />
                {artist.strCountry}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {artist.strGenre && (
              <Badge variant="secondary">{artist.strGenre}</Badge>
            )}
            {artist.strStyle && artist.strStyle !== artist.strGenre && (
              <Badge variant="outline">{artist.strStyle}</Badge>
            )}
            {artist.strMood && (
              <Badge variant="outline">{artist.strMood}</Badge>
            )}
          </div>

          <div className="flex gap-2">
            {artist.strWebsite && (
              <a href={`https://${artist.strWebsite}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Website
                </Button>
              </a>
            )}
            {artist.strFacebook && (
              <a href={`https://${artist.strFacebook}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Facebook</Button>
              </a>
            )}
            {artist.strTwitter && (
              <a href={`https://${artist.strTwitter}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">Twitter</Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Biography */}
      {truncatedBio && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">{truncatedBio}</p>
          </CardContent>
        </Card>
      )}

      {/* Fans who love this artist */}
      {fans && fans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Fans ({fans.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {fans.map((fan) => (
                <Link 
                  key={fan.user_id} 
                  to={`/profile/${fan.username || fan.user_id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={fan.avatar_url || undefined} />
                    <AvatarFallback>{fan.display_name?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{fan.display_name || 'User'}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discography */}
      {loadingDiscography ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : discography && discography.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Disc className="h-5 w-5" />
              Discography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {discography.slice(0, 12).map((album) => (
                <div key={album.idAlbum} className="text-center">
                  {album.strAlbumThumb ? (
                    <img 
                      src={album.strAlbumThumb} 
                      alt={album.strAlbum}
                      className="w-full aspect-square object-cover rounded-lg shadow mb-2"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center mb-2">
                      <Disc className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <p className="font-medium text-sm truncate">{album.strAlbum}</p>
                  {album.intYearReleased && (
                    <p className="text-xs text-muted-foreground">{album.intYearReleased}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
