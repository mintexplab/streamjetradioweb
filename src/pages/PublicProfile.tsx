import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useFollows, useToggleFollow } from '@/hooks/useFollows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Radio, ArrowLeft, UserPlus, UserCheck, MessageCircle, BadgeCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useSendDM, useDirectMessages } from '@/hooks/useDirectMessages';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import streamjetLogo from '@/assets/streamjet-logo.svg';

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

function useUserListeningStatus(userId: string) {
  return useQuery({
    queryKey: ['user-listening', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('active_listeners')
        .select('station_name, station_uuid')
        .eq('user_id', userId)
        .gte('last_heartbeat', new Date(Date.now() - 2 * 60 * 1000).toISOString())
        .limit(1);
      return data?.[0] || null;
    },
    enabled: !!userId,
    refetchInterval: 15000,
  });
}

export default function PublicProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const username = handle?.startsWith('@') ? handle.slice(1) : handle;
  const [showDM, setShowDM] = useState(false);

  const { data: profile, isLoading: loadingProfile, error } = usePublicProfile(username || '');
  const { data: followData } = useFollows(profile?.user_id);
  const toggleFollow = useToggleFollow();
  const { data: listeningTo } = useUserListeningStatus(profile?.user_id || '');
  const { currentStation, play } = useRadioPlayer();

  const isOwnProfile = user?.id === profile?.user_id;

  const handleFollow = async () => {
    if (!profile) return;
    await toggleFollow.mutateAsync({ userId: profile.user_id, isFollowing: followData?.isFollowing || false });
  };

  const handleTuneIn = () => {
    if (!listeningTo) return;
    play({
      stationuuid: listeningTo.station_uuid,
      name: listeningTo.station_name,
      url: '', url_resolved: '', homepage: '', favicon: '', country: '', countrycode: '',
      state: '', language: '', languagecodes: '', votes: 0, codec: '', bitrate: 0,
      tags: '', clickcount: 0, clicktrend: 0,
    });
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-background p-6 animate-fade-in">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 animate-fade-in">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
            <Link to="/"><Button><ArrowLeft className="w-4 h-4 mr-2" /> Go Home</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto p-4 flex items-center gap-4">
          <Link to="/player">
            <img src={streamjetLogo} alt="StreamJet" className="h-8" />
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6 animate-fade-in">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-brand text-white text-2xl">
                  <User className="w-10 h-10" />
                </AvatarFallback>
              </Avatar>

              <div className="text-center sm:text-left flex-1">
                <h1 className="text-xl font-bold flex items-center gap-2">
                  {profile.display_name || `@${profile.username}`}
                  {profile.is_verified && <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />}
                </h1>
                <p className="text-primary text-sm">@{profile.username}</p>
                {profile.bio && <p className="text-muted-foreground mt-2 text-sm">{profile.bio}</p>}

                {/* Currently listening */}
                {listeningTo && (
                  <button
                    onClick={handleTuneIn}
                    className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 transition-colors text-sm"
                  >
                    <Radio className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-primary font-medium">Listening to {listeningTo.station_name}</span>
                  </button>
                )}

                {/* Follow stats */}
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">{followData?.followerCount || 0}</strong> followers</span>
                  <span><strong className="text-foreground">{followData?.followingCount || 0}</strong> following</span>
                </div>
              </div>

              {/* Actions */}
              {!isOwnProfile && user && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setShowDM(!showDM)}>
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={followData?.isFollowing ? 'secondary' : 'default'}
                    onClick={handleFollow}
                    disabled={toggleFollow.isPending}
                    size="sm"
                  >
                    {followData?.isFollowing ? (
                      <><UserCheck className="w-4 h-4 mr-1" /> Following</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-1" /> Follow</>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DM Panel */}
        {showDM && !isOwnProfile && user && (
          <InlineDMPanel partnerId={profile.user_id} />
        )}
      </main>
    </div>
  );
}

function InlineDMPanel({ partnerId }: { partnerId: string }) {
  const { data: messages } = useDirectMessages(partnerId);
  const sendDM = useSendDM();
  const { user } = useAuth();
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendDM.mutateAsync({ receiverId: partnerId, content: text.trim() });
    setText('');
  };

  return (
    <Card className="animate-scale-in">
      <CardContent className="p-4 space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-2">
          {messages?.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">Start a conversation</p>
          )}
          {messages?.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                'max-w-[75%] px-3 py-2 text-sm',
                msg.sender_id === user?.id ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'
              )}
            >
              {msg.content}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="icon" onClick={handleSend} disabled={!text.trim() || sendDM.isPending}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
