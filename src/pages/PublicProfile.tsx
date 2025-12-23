import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePlaylistStations } from '@/hooks/usePlaylists';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Radio, Play, Pause, ArrowLeft, ListMusic } from 'lucide-react';
import { ProfileReactionStats } from '@/components/dashboard/ProfileReactionStats';
import { CurrentlyListeningBadge } from '@/components/dashboard/CurrentlyListeningBadge';

function usePublicProfile(username: string) {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!username,
  });
}

function usePublicPlaylists(userId: string) {
  return useQuery({
    queryKey: ['public-playlists', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

function PlaylistCard({ playlist }: { playlist: any }) {
  const { data: stations } = usePlaylistStations(playlist.id);
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();

  const handlePlayFirst = () => {
    if (!stations || stations.length === 0) return;
    const station = stations[0];
    const stationData = {
      stationuuid: station.station_uuid,
      name: station.station_name,
      url: station.station_url,
      url_resolved: station.station_url,
      homepage: '',
      favicon: station.station_favicon || '',
      country: station.station_country || '',
      countrycode: '',
      state: '',
      language: '',
      languagecodes: '',
      votes: 0,
      codec: '',
      bitrate: 0,
      tags: station.station_tags || '',
      clickcount: 0,
      clicktrend: 0,
    };

    if (currentStation?.stationuuid === station.station_uuid) {
      if (isPlaying) pause();
      else resume();
    } else {
      play(stationData);
    }
  };

  return (
    <Card className="hover:shadow-brand transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            className="rounded-full flex-shrink-0"
            onClick={handlePlayFirst}
            disabled={!stations || stations.length === 0}
          >
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{playlist.name}</h3>
            <p className="text-sm text-muted-foreground">
              {stations?.length || 0} stations
            </p>
          </div>
          
          <Link to={`/dashboard?share=${playlist.share_code}`}>
            <Button variant="outline" size="sm">
              <ListMusic className="w-4 h-4 mr-2" />
              View
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>();
  const username = handle?.startsWith('@') ? handle.slice(1) : handle;
  
  const { data: profile, isLoading: loadingProfile, error } = usePublicProfile(username || '');
  const { data: playlists, isLoading: loadingPlaylists } = usePublicPlaylists(profile?.user_id || '');

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The user @{username} doesn't exist or hasn't set up their profile yet.
            </p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-brand">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gradient-brand">StreamJet</span>
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-brand text-white text-3xl">
                  <User className="w-12 h-12" />
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center md:text-left flex-1">
                <h1 className="text-2xl font-bold">
                  {profile.display_name || `@${profile.username}`}
                </h1>
                <p className="text-primary">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reaction Stats */}
        <ProfileReactionStats userId={profile.user_id} />

        {/* Public Playlists */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Public Playlists</h2>
          
          {loadingPlaylists ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <ListMusic className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No public playlists yet
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
