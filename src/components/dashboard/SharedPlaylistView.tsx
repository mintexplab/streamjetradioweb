import { usePlaylistByShareCode, usePlaylistStations } from '@/hooks/usePlaylists';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Pause, Radio, Share2, Users } from 'lucide-react';

interface SharedPlaylistViewProps {
  shareCode: string;
}

export function SharedPlaylistView({ shareCode }: SharedPlaylistViewProps) {
  const { data: playlist, isLoading: loadingPlaylist } = usePlaylistByShareCode(shareCode);
  const { data: stations, isLoading: loadingStations } = usePlaylistStations(playlist?.id || '');
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();

  if (loadingPlaylist) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="p-6 text-center py-12">
        <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Playlist not found</h2>
        <p className="text-muted-foreground">
          This playlist may have been deleted or made private.
        </p>
      </div>
    );
  }

  const handlePlayStation = (station: typeof stations extends (infer T)[] ? T : never) => {
    if (!station) return;
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
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play(stationData);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-brand">
          <Users className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{playlist.name}</h2>
          <p className="text-muted-foreground">Shared playlist</p>
        </div>
      </div>

      {playlist.description && (
        <p className="text-muted-foreground">{playlist.description}</p>
      )}

      <div className="space-y-2">
        {loadingStations ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))
        ) : stations?.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            This playlist is empty.
          </p>
        ) : (
          stations?.map((station, index) => {
            const isCurrentStation = currentStation?.stationuuid === station.station_uuid;
            return (
              <Card
                key={station.id}
                className={`transition-all hover:bg-muted/50 ${isCurrentStation ? 'ring-2 ring-primary' : ''}`}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <span className="text-muted-foreground w-6 text-right">{index + 1}</span>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handlePlayStation(station)}
                  >
                    {isCurrentStation && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {station.station_favicon ? (
                    <img
                      src={station.station_favicon}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gradient-brand flex items-center justify-center">
                      <Radio className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{station.station_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {station.station_country}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
