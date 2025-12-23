import { useTrendingStations } from '@/hooks/useReactions';
import { useTopStations } from '@/hooks/useRadioStations';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EnergyMeter } from './EnergyMeter';
import { LiveListenersBadge } from './LiveListenersBadge';
import { TrendingUp, Play, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TrendingStations() {
  const { data: trendingStations, isLoading: trendingLoading } = useTrendingStations(5);
  const { data: topStations, isLoading: topLoading } = useTopStations(10);
  const { play, currentStation, isPlaying } = useRadioPlayer();

  const isLoading = trendingLoading || topLoading;

  // Merge trending data with station data
  const stationsWithEnergy = trendingStations?.map(ts => {
    const fullStation = topStations?.find(s => s.stationuuid === ts.uuid);
    return {
      ...ts,
      fullStation,
    };
  }).filter(s => s.fullStation) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-streamjet-red" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stationsWithEnergy.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Flame className="h-5 w-5 text-streamjet-red animate-pulse" />
          Trending Now
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {stationsWithEnergy.map((station, index) => {
          const isCurrentlyPlaying = currentStation?.stationuuid === station.uuid && isPlaying;

          return (
            <div
              key={station.uuid}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                'hover:bg-accent/50 cursor-pointer',
                isCurrentlyPlaying && 'bg-primary/10'
              )}
              onClick={() => station.fullStation && play(station.fullStation)}
            >
              <span className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                index === 0 ? 'bg-streamjet-red text-primary-foreground' :
                index === 1 ? 'bg-streamjet-purple text-primary-foreground' :
                index === 2 ? 'bg-streamjet-blue text-primary-foreground' :
                'bg-muted text-muted-foreground'
              )}>
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{station.name}</span>
                  <LiveListenersBadge stationUuid={station.uuid} />
                </div>
                <EnergyMeter stationUuid={station.uuid} size="sm" />
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 shrink-0"
              >
                <Play className={cn('h-4 w-4', isCurrentlyPlaying && 'text-primary')} />
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
