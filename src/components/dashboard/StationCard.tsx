import { RadioStation } from '@/hooks/useRadioStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Play, Pause, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: RadioStation;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function StationCard({ station }: StationCardProps) {
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const navigate = useNavigate();

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentStation) {
      isPlaying ? pause() : resume();
    } else {
      play(station);
    }
  };

  const handleNavigate = () => {
    if (!isCurrentStation) play(station);
    navigate(`/station/${station.stationuuid}`);
  };

  const tags = station.tags?.split(',').slice(0, 2) || [];

  return (
    <div
      className={cn(
        'group relative p-3 transition-all duration-200 cursor-pointer',
        'bg-card hover:bg-accent/60',
      )}
      onClick={handleNavigate}
    >
      <div className="relative aspect-square overflow-hidden mb-3 bg-muted shadow-sm">
        {station.favicon ? (
          <img
            src={station.favicon}
            alt={station.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '';
              e.currentTarget.onerror = null;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-accent">
            <Radio className="w-10 h-10 text-muted-foreground" />
          </div>
        )}

        <button
          onClick={handlePlayPause}
          className={cn(
            'absolute bottom-2 right-2 w-11 h-11 flex items-center justify-center',
            'bg-primary text-primary-foreground shadow-lg shadow-black/30',
            'transition-all duration-200',
            'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
            isCurrentStation && isPlaying && 'opacity-100 translate-y-0'
          )}
        >
          {isCurrentStation && isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
      </div>

      <h3 className="font-bold text-sm truncate">{station.name}</h3>
      <p className="text-xs text-muted-foreground truncate mt-1">
        {station.country}
        {tags.length > 0 && ` · ${tags.map(t => t.trim()).join(', ')}`}
      </p>
    </div>
  );
}
