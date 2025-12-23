import { SavedStation } from '@/hooks/useSavedStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useUnsaveStation } from '@/hooks/useSavedStations';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Radio, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SavedStationsViewProps {
  stations: SavedStation[];
}

export function SavedStationsView({ stations }: SavedStationsViewProps) {
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const unsaveStation = useUnsaveStation();
  const { toast } = useToast();

  const handlePlayStation = (station: SavedStation) => {
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
      codec: station.station_codec || '',
      bitrate: station.station_bitrate || 0,
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

  const handleUnsave = async (stationUuid: string) => {
    await unsaveStation.mutateAsync(stationUuid);
    toast({ title: 'Station removed from saved' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-streamjet-red fill-streamjet-red" />
        <h2 className="text-2xl font-bold">Saved Stations</h2>
      </div>

      {stations.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No saved stations yet. Explore and save your favorites!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map((station) => {
            const isCurrentStation = currentStation?.stationuuid === station.station_uuid;
            return (
              <Card
                key={station.id}
                className={`transition-all hover:shadow-brand ${isCurrentStation ? 'ring-2 ring-primary' : ''}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <Button
                    size="icon"
                    className="rounded-full flex-shrink-0"
                    onClick={() => handlePlayStation(station)}
                  >
                    {isCurrentStation && isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5 ml-0.5" />
                    )}
                  </Button>

                  {station.station_favicon ? (
                    <img
                      src={station.station_favicon}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover bg-muted flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{station.station_name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {station.station_country}
                      {station.station_bitrate ? ` • ${station.station_bitrate} kbps` : ''}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUnsave(station.station_uuid)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
