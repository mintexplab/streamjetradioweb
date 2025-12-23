import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SpotifyPlayerBar() {
  const { isConnected, isPremium, connect, disconnect, spotifyUser } = useSpotifyAuth();
  const { 
    isReady, 
    isPlaying, 
    currentTrack, 
    position, 
    duration, 
    volume,
    pause, 
    resume, 
    setVolume,
    nextTrack,
    previousTrack,
  } = useSpotifyPlayer();

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Not connected to Spotify
  if (!isConnected) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="w-10 h-10 rounded-lg bg-[#1DB954] flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Connect to Spotify</p>
          <p className="text-xs text-muted-foreground">Play your own music with Spotify Premium</p>
        </div>
        <Button onClick={connect} className="bg-[#1DB954] hover:bg-[#1ed760] text-black">
          Connect
        </Button>
      </div>
    );
  }

  // Connected but not premium
  if (!isPremium) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="w-10 h-10 rounded-lg bg-[#1DB954] flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Spotify Free Account</p>
          <p className="text-xs text-muted-foreground">Upgrade to Premium to play tracks in StreamJet</p>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  // Premium but player not ready
  if (!isReady) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="w-10 h-10 rounded-lg bg-[#1DB954] flex items-center justify-center animate-pulse">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Connecting to Spotify...</p>
          <p className="text-xs text-muted-foreground">
            {spotifyUser?.display_name || 'Loading player'}
          </p>
        </div>
      </div>
    );
  }

  // No track playing
  if (!currentTrack) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#1DB954]/10 to-transparent border border-[#1DB954]/20">
        <div className="w-10 h-10 rounded-lg bg-[#1DB954] flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">Spotify Ready</p>
          <p className="text-xs text-muted-foreground">
            Connected as {spotifyUser?.display_name} • Search for tracks to play
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  // Playing track
  return (
    <div className="p-4 rounded-lg bg-gradient-to-r from-[#1DB954]/10 to-transparent border border-[#1DB954]/20 space-y-3">
      <div className="flex items-center gap-3">
        {/* Album Art */}
        <img
          src={currentTrack.album.images?.[0]?.url}
          alt={currentTrack.album.name}
          className="w-14 h-14 rounded-lg object-cover"
        />

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{currentTrack.name}</p>
          <p className="text-sm text-muted-foreground truncate">
            {currentTrack.artists.map(a => a.name).join(', ')}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={previousTrack}>
            <SkipBack className="w-4 h-4" />
          </Button>
          <Button 
            size="icon" 
            className="w-10 h-10 rounded-full bg-[#1DB954] hover:bg-[#1ed760] text-black"
            onClick={isPlaying ? pause : resume}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </Button>
          <Button size="icon" variant="ghost" onClick={nextTrack}>
            <SkipForward className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 w-28">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            max={100}
            step={1}
            onValueChange={([value]) => setVolume(value / 100)}
            className="flex-1"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{formatTime(position)}</span>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#1DB954] transition-all duration-1000"
            style={{ width: `${(position / duration) * 100}%` }}
          />
        </div>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
