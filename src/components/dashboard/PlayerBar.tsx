import { useState } from 'react';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Volume1, Radio, Loader2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function PlayerBar() {
  const { currentStation, isPlaying, volume, isLoading, error, pause, resume, stop, setVolume } =
    useRadioPlayer();
  const navigate = useNavigate();
  const [mini, setMini] = useState(false);

  if (!currentStation) return null;

  const handlePlayPause = () => {
    isPlaying ? pause() : resume();
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  // Mini player
  if (mini) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
        <div className="flex items-center gap-2 bg-card border border-border pl-2 pr-1 py-1 shadow-lg shadow-black/20 backdrop-blur-xl">
          {currentStation.favicon ? (
            <img src={currentStation.favicon} alt="" className="w-8 h-8 object-cover bg-muted" onError={(e) => { e.currentTarget.src = ''; }} />
          ) : (
            <div className="w-8 h-8 bg-accent flex items-center justify-center">
              <Radio className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
          <span className="text-xs font-medium max-w-[100px] truncate">{currentStation.name}</span>
          <Button size="icon" className="w-7 h-7 bg-foreground text-background hover:bg-foreground/90" onClick={handlePlayPause} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground" onClick={() => setMini(false)}>
            <ChevronUp className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-in">
      <div className="bg-background/95 backdrop-blur-xl border-t border-border">
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
                className="w-14 h-14 object-cover bg-muted flex-shrink-0 shadow-md"
                onError={(e) => { e.currentTarget.src = ''; e.currentTarget.onerror = null; }}
              />
            ) : (
              <div className="w-14 h-14 bg-accent flex items-center justify-center flex-shrink-0">
                <Radio className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{currentStation.name}</h4>
              <p className="text-xs text-muted-foreground truncate">
                {currentStation.country}
                {currentStation.bitrate ? ` · ${currentStation.bitrate}kbps` : ''}
              </p>
            </div>
          </div>

          {/* Center Controls */}
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-destructive mr-2 hidden sm:block">{error}</p>}
            <Button
              size="icon"
              className="w-10 h-10 bg-foreground text-background hover:bg-foreground/90 hover:scale-105 active:scale-95 transition-all"
              onClick={handlePlayPause}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
          </div>

          {/* Right: Volume + actions */}
          <div className="hidden sm:flex items-center gap-2 flex-1 justify-end">
            <div className="flex items-center gap-1.5 group/vol">
              <Button
                size="icon"
                variant="ghost"
                className="w-8 h-8 text-muted-foreground hover:text-foreground"
                onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
              >
                <VolumeIcon className="w-4 h-4" />
              </Button>
              <div className="w-24 group-hover/vol:w-28 transition-all duration-200">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={([v]) => setVolume(v / 100)}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="flex items-center gap-0.5 ml-2">
              <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-foreground" onClick={() => setMini(true)} title="Mini player">
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" onClick={stop} className="w-7 h-7 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
