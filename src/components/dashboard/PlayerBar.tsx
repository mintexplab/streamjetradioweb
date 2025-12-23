import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Radio, Loader2, X } from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';

export function PlayerBar() {
  const { currentStation, isPlaying, volume, isLoading, error, play, pause, resume, stop, setVolume } =
    useRadioPlayer();

  if (!currentStation) {
    return null;
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 max-w-screen-2xl mx-auto">
        {/* Station Info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {currentStation.favicon ? (
            <img
              src={currentStation.favicon}
              alt={currentStation.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-muted flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = '';
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold truncate text-sm sm:text-base">{currentStation.name}</h4>
              <AudioVisualizer barCount={4} className="hidden sm:flex" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {currentStation.country}
              {currentStation.bitrate ? ` • ${currentStation.bitrate} kbps` : ''}
            </p>
          </div>
        </div>

        {/* Mobile Visualizer */}
        <AudioVisualizer barCount={3} className="flex sm:hidden" />

        {/* Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {error ? (
            <p className="text-xs text-destructive mr-2 hidden sm:block">{error}</p>
          ) : null}

          <Button
            size="icon"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />
            )}
          </Button>

          <Button size="icon" variant="ghost" onClick={stop} className="w-8 h-8 sm:w-10 sm:h-10">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Volume - Hidden on mobile */}
        <div className="hidden sm:flex items-center gap-2 w-36">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
          >
            {volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
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
    </div>
  );
}
