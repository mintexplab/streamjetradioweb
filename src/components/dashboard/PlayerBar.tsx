import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Radio, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function PlayerBar() {
  const { currentStation, isPlaying, volume, isLoading, error, pause, resume, stop, setVolume } =
    useRadioPlayer();
  const navigate = useNavigate();

  if (!currentStation) return null;

  const handlePlayPause = () => {
    isPlaying ? pause() : resume();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-50">
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-screen-2xl mx-auto">
        {/* Station Info */}
        <div
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
          onClick={() => navigate(`/station/${currentStation.stationuuid}`)}
        >
          {currentStation.favicon ? (
            <img
              src={currentStation.favicon}
              alt={currentStation.name}
              className="w-10 h-10 rounded object-cover bg-muted flex-shrink-0"
              onError={(e) => { e.currentTarget.src = ''; e.currentTarget.onerror = null; }}
            />
          ) : (
            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:underline">{currentStation.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {currentStation.country}
              {currentStation.bitrate ? ` · ${currentStation.bitrate}kbps` : ''}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1">
          {error && <p className="text-xs text-destructive mr-2 hidden sm:block">{error}</p>}
          <Button
            size="icon"
            className="w-9 h-9 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-transform"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
          <Button size="icon" variant="ghost" onClick={stop} className="w-8 h-8 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2 w-32">
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
          >
            {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
    </div>
  );
}
