import { RadioStation } from '@/hooks/useRadioStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useSavedStations, useSaveStation, useUnsaveStation } from '@/hooks/useSavedStations';
import { Button } from '@/components/ui/button';
import { Play, Pause, Heart, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: RadioStation;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function StationCard({ station, showRemove, onRemove }: StationCardProps) {
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { data: savedStations } = useSavedStations();
  const saveStation = useSaveStation();
  const unsaveStation = useUnsaveStation();
  const { toast } = useToast();

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isSaved = savedStations?.some((s) => s.station_uuid === station.stationuuid);

  const handlePlayPause = () => {
    if (isCurrentStation) {
      isPlaying ? pause() : resume();
    } else {
      play(station);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (isSaved) {
        await unsaveStation.mutateAsync(station.stationuuid);
      } else {
        await saveStation.mutateAsync(station);
        toast({ title: 'Added to Liked Stations' });
      }
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const tags = station.tags?.split(',').slice(0, 2) || [];

  return (
    <div
      className={cn(
        'group relative rounded-md p-3 transition-all cursor-pointer',
        'bg-card hover:bg-accent/60',
        isCurrentStation && 'ring-1 ring-primary/50 bg-accent/40'
      )}
      onClick={handlePlayPause}
    >
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          {station.favicon ? (
            <img
              src={station.favicon}
              alt={station.name}
              className="w-12 h-12 rounded object-cover bg-muted"
              onError={(e) => {
                e.currentTarget.src = '';
                e.currentTarget.onerror = null;
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded bg-accent flex items-center justify-center">
              <Radio className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center rounded bg-black/50',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isCurrentStation && isPlaying && 'opacity-100'
          )}>
            {isCurrentStation && isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{station.name}</h3>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {station.country}
            {tags.length > 0 && ` · ${tags.map(t => t.trim()).join(', ')}`}
          </p>
        </div>

        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity',
            isSaved && 'opacity-100 text-primary'
          )}
          onClick={handleSaveToggle}
        >
          <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
        </Button>
      </div>
    </div>
  );
}
