import { usePinnedStations, useUnpinStation, useToggleGoTo, PinnedStation } from '@/hooks/usePinnedStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Radio, Play, Pause, Pin, Star, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StationLibraryProps {
  userId?: string;
  isOwn?: boolean;
}

export function StationLibrary({ userId, isOwn = true }: StationLibraryProps) {
  const { data: pinnedStations, isLoading } = usePinnedStations(userId);
  const unpinStation = useUnpinStation();
  const toggleGoTo = useToggleGoTo();
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { toast } = useToast();

  const goToStations = pinnedStations?.filter(s => s.is_go_to) || [];
  const otherStations = pinnedStations?.filter(s => !s.is_go_to) || [];

  const handlePlay = (station: PinnedStation) => {
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

  const handleUnpin = async (stationUuid: string) => {
    await unpinStation.mutateAsync(stationUuid);
    toast({ title: 'Station unpinned' });
  };

  const handleToggleGoTo = async (station: PinnedStation) => {
    await toggleGoTo.mutateAsync({ stationId: station.id, isGoTo: !station.is_go_to });
    toast({ title: station.is_go_to ? 'Removed from go-to stations' : 'Added to go-to stations' });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Go-To Stations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Go-To Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goToStations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {isOwn ? 'Mark your favorite stations as go-to!' : 'No go-to stations yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {goToStations.map((station) => (
                <StationRow 
                  key={station.id}
                  station={station}
                  isPlaying={currentStation?.stationuuid === station.station_uuid && isPlaying}
                  onPlay={() => handlePlay(station)}
                  onUnpin={isOwn ? () => handleUnpin(station.station_uuid) : undefined}
                  onToggleGoTo={isOwn ? () => handleToggleGoTo(station) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Pinned Stations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Pin className="w-5 h-5" />
            Pinned Stations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {otherStations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              {isOwn ? 'Pin stations to build your library!' : 'No pinned stations yet'}
            </p>
          ) : (
            <div className="space-y-2">
              {otherStations.map((station) => (
                <StationRow 
                  key={station.id}
                  station={station}
                  isPlaying={currentStation?.stationuuid === station.station_uuid && isPlaying}
                  onPlay={() => handlePlay(station)}
                  onUnpin={isOwn ? () => handleUnpin(station.station_uuid) : undefined}
                  onToggleGoTo={isOwn ? () => handleToggleGoTo(station) : undefined}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StationRow({ 
  station, 
  isPlaying,
  onPlay,
  onUnpin,
  onToggleGoTo,
}: { 
  station: PinnedStation;
  isPlaying: boolean;
  onPlay: () => void;
  onUnpin?: () => void;
  onToggleGoTo?: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
      <Button
        size="icon"
        variant="ghost"
        className="shrink-0"
        onClick={onPlay}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      {station.station_favicon ? (
        <img
          src={station.station_favicon}
          alt=""
          className="w-10 h-10 rounded-md object-cover bg-muted shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
          <Radio className="w-5 h-5 text-primary" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{station.station_name}</p>
        {station.station_country && (
          <p className="text-sm text-muted-foreground truncate">{station.station_country}</p>
        )}
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleGoTo && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleGoTo}
            className={station.is_go_to ? 'text-yellow-500' : ''}
          >
            <Star className="w-4 h-4" />
          </Button>
        )}
        {onUnpin && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onUnpin}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
