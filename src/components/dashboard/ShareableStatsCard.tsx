import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download, Share2, Music, User, Flame, Moon, Sun } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useFavoriteArtists, useFavoriteTracks, useUserMusicRoles } from '@/hooks/useMusicIdentity';
import { useUserStationStats, getReactionPersonality, getTopStations } from '@/hooks/useUserStationStats';
import { useToast } from '@/hooks/use-toast';

interface ShareableStatsCardProps {
  userId?: string;
}

export function ShareableStatsCard({ userId }: ShareableStatsCardProps) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const { data: profile } = useProfile(targetUserId);
  const { data: artists = [] } = useFavoriteArtists(targetUserId);
  const { data: tracks = [] } = useFavoriteTracks(targetUserId);
  const { data: roles = [] } = useUserMusicRoles(targetUserId);
  const { data: stationStats = [] } = useUserStationStats(targetUserId);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const personality = getReactionPersonality(stationStats);
  const topStations = getTopStations(stationStats, 3);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      link.download = `music-identity-${profile?.username || 'user'}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: 'Image downloaded!',
        description: 'Your music identity card has been saved.',
      });
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast({
        title: 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
      });
      
      // Convert to blob for sharing
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'music-identity.png', { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Music Identity',
          text: 'Check out my music identity!',
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        toast({
          title: 'Copied to clipboard!',
          description: 'Your music identity card has been copied.',
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      toast({
        title: 'Failed to share',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* The shareable card */}
      <div
        ref={cardRef}
        className="p-6 rounded-xl bg-gradient-to-br from-background via-background to-primary/10 border border-border"
        style={{ width: '400px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16 border-2 border-primary">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-bold text-lg">
              {profile?.display_name || profile?.username || 'Anonymous'}
            </h3>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            <Badge variant="secondary" className="mt-1">
              {personality.emoji} {personality.label}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">
              {stationStats.reduce((sum, s) => sum + s.fire_count, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Fire Given</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Music className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{topStations.length}</p>
            <p className="text-xs text-muted-foreground">Top Stations</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <Sun className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{artists.length}</p>
            <p className="text-xs text-muted-foreground">Artists</p>
          </div>
        </div>

        {/* Top Artists */}
        {artists.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Top Artists</h4>
            <div className="flex flex-wrap gap-2">
              {artists.slice(0, 5).map((artist) => (
                <Badge key={artist.id} variant="outline" className="text-xs">
                  {artist.artist_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top Tracks */}
        {tracks.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Top Tracks</h4>
            <div className="flex flex-wrap gap-2">
              {tracks.slice(0, 3).map((track) => (
                <Badge key={track.id} variant="outline" className="text-xs">
                  {track.track_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Roles */}
        {roles.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold mb-2">Music Roles</h4>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role.id} variant="secondary" className="text-xs">
                  {role.role_name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Watermark */}
        <div className="text-center pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            🎵 My Music Identity • radiowave.app
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleDownload} disabled={isGenerating} className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download
        </Button>
        <Button onClick={handleShare} disabled={isGenerating} variant="secondary" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </div>
    </div>
  );
}
