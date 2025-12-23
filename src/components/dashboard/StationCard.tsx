import { RadioStation } from '@/hooks/useRadioStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useSavedStations, useSaveStation, useUnsaveStation } from '@/hooks/useSavedStations';
import { usePlaylists, useAddStationToPlaylist } from '@/hooks/usePlaylists';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Play, Pause, Heart, MoreHorizontal, ListPlus, Radio } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReactionBar } from './ReactionBar';
import { EnergyMeter } from './EnergyMeter';
import { LiveListenersBadge } from './LiveListenersBadge';
import { VibePulseBadge } from './VibePulse';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface StationCardProps {
  station: RadioStation;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function StationCard({ station, showRemove, onRemove }: StationCardProps) {
  const { user } = useAuth();
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { data: savedStations } = useSavedStations();
  const { data: playlists } = usePlaylists();
  const saveStation = useSaveStation();
  const unsaveStation = useUnsaveStation();
  const addToPlaylist = useAddStationToPlaylist();
  const { toast } = useToast();

  const isCurrentStation = currentStation?.stationuuid === station.stationuuid;
  const isSaved = savedStations?.some((s) => s.station_uuid === station.stationuuid);

  const handlePlayPause = () => {
    if (isCurrentStation) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play(station);
    }
  };

  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await unsaveStation.mutateAsync(station.stationuuid);
        toast({ title: 'Station removed from saved' });
      } else {
        await saveStation.mutateAsync(station);
        toast({ title: 'Station saved!' });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update saved stations',
        variant: 'destructive',
      });
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    try {
      await addToPlaylist.mutateAsync({ playlistId, station });
      toast({ title: 'Added to playlist!' });
    } catch {
      toast({
        title: 'Error',
        description: 'Station may already be in this playlist',
        variant: 'destructive',
      });
    }
  };

  const tags = station.tags?.split(',').slice(0, 3) || [];

  return (
    <Card className={cn(
      'group transition-all hover:shadow-brand',
      isCurrentStation && 'ring-2 ring-primary'
    )}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <div className="relative flex-shrink-0">
            {station.favicon ? (
              <img
                src={station.favicon}
                alt={station.name}
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover bg-muted"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.onerror = null;
                }}
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-brand flex items-center justify-center">
                <Radio className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
            )}
            <Button
              size="icon"
              className="absolute inset-0 m-auto w-8 h-8 sm:w-10 sm:h-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handlePlayPause}
            >
              {isCurrentStation && isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
              )}
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate text-sm sm:text-base" title={station.name}>
                {station.name}
              </h3>
              <LiveListenersBadge stationUuid={station.stationuuid} />
              <VibePulseBadge stationUuid={station.stationuuid} />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {station.country}
              {station.bitrate ? ` • ${station.bitrate} kbps` : ''}
            </p>
            
            {/* Energy meter */}
            <div className="mt-1">
              <EnergyMeter stationUuid={station.stationuuid} size="sm" />
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn('w-8 h-8 sm:w-10 sm:h-10', isSaved && 'text-streamjet-red')}
              onClick={handleSaveToggle}
            >
              <Heart className={cn('w-4 h-4', isSaved && 'fill-current')} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="w-8 h-8 sm:w-10 sm:h-10">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {playlists && playlists.length > 0 && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ListPlus className="w-4 h-4 mr-2" />
                      Add to Playlist
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {playlists.map((playlist) => (
                        <DropdownMenuItem
                          key={playlist.id}
                          onClick={() => handleAddToPlaylist(playlist.id)}
                        >
                          {playlist.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                {showRemove && onRemove && (
                  <DropdownMenuItem onClick={onRemove} className="text-destructive">
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Reaction bar - show when hovering or when user is logged in and station is playing */}
        {user && isCurrentStation && (
          <div className="mt-3 pt-3 border-t border-border">
            <ReactionBar 
              stationUuid={station.stationuuid} 
              stationName={station.name}
              compact
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
