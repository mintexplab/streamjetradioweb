import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePinnedStations } from '@/hooks/usePinnedStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useFriendshipStatus, useSendFriendRequest } from '@/hooks/useFriendships';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Radio, Play, ArrowLeft, Pin, UserPlus, Check, Clock, BadgeCheck } from 'lucide-react';
import { ProfileReactionStats } from '@/components/dashboard/ProfileReactionStats';
import { TemporalStats } from '@/components/dashboard/TemporalStats';
import { ProfileMusicIdentity } from '@/components/dashboard/ProfileMusicIdentity';
import { TasteCompatibilityDisplay } from '@/components/dashboard/TasteCompatibilityDisplay';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

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

export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const username = handle?.startsWith('@') ? handle.slice(1) : handle;
  const { toast } = useToast();
  
  const { data: profile, isLoading: loadingProfile, error } = usePublicProfile(username || '');
  const { data: pinnedStations, isLoading: loadingStations } = usePinnedStations(profile?.user_id);
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  
  const { isFriend, isPending, isRequester } = useFriendshipStatus(profile?.user_id || '');
  const sendRequest = useSendFriendRequest();

  const handleAddFriend = async () => {
    if (!profile) return;
    try {
      await sendRequest.mutateAsync(profile.user_id);
      toast({ title: 'Friend request sent!' });
    } catch {
      toast({ title: 'Failed to send request', variant: 'destructive' });
    }
  };

  const handlePlayStation = (station: typeof pinnedStations extends (infer T)[] ? T : never) => {
    if (!station) return;
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

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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

  const isOwnProfile = user?.id === profile.user_id;
  const goToStations = pinnedStations?.filter(s => s.is_go_to) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto p-4 flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-brand">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gradient-brand">StreamJet</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {profile.display_name || `@${profile.username}`}
                  {profile.is_verified && (
                    <BadgeCheck className="w-6 h-6 text-primary fill-primary/20" />
                  )}
                </h1>
                <p className="text-primary">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
                )}
              </div>

              {/* Friend actions */}
              {!isOwnProfile && user && (
                <div>
                  {isFriend ? (
                    <Button variant="outline" disabled>
                      <Check className="w-4 h-4 mr-2" />
                      Friends
                    </Button>
                  ) : isPending ? (
                    <Button variant="outline" disabled>
                      <Clock className="w-4 h-4 mr-2" />
                      {isRequester ? 'Request Sent' : 'Pending'}
                    </Button>
                  ) : (
                    <Button onClick={handleAddFriend} disabled={sendRequest.isPending}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Taste Compatibility - Only show on other profiles */}
        {!isOwnProfile && user && (
          <TasteCompatibilityDisplay userId={profile.user_id} showDetails />
        )}

        {/* Music Identity */}
        <ProfileMusicIdentity userId={profile.user_id} />

        {/* Reaction Stats */}
        <ProfileReactionStats userId={profile.user_id} />

        {/* Temporal Listening Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Listening Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <TemporalStats userId={profile.user_id} />
          </CardContent>
        </Card>

        {/* Go-To Stations */}
        {goToStations.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pin className="w-5 h-5" />
                Go-To Stations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {goToStations.map((station) => {
                const isCurrentStation = currentStation?.stationuuid === station.station_uuid;
                return (
                  <div 
                    key={station.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePlayStation(station)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    
                    {station.station_favicon ? (
                      <img
                        src={station.station_favicon}
                        alt=""
                        className="w-10 h-10 rounded-md object-cover bg-muted"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center">
                        <Radio className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{station.station_name}</p>
                      {station.station_country && (
                        <p className="text-sm text-muted-foreground">{station.station_country}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
