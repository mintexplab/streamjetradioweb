import { RadioStation } from '@/hooks/useRadioStations';
import { StationCard } from './StationCard';
import { Skeleton } from '@/components/ui/skeleton';

interface StationGridProps {
  stations: RadioStation[];
  isLoading: boolean;
  emptyMessage?: string;
}

export function StationGrid({ stations, isLoading, emptyMessage = 'No stations found' }: StationGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (stations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {stations.map((station) => (
        <StationCard key={station.stationuuid} station={station} />
      ))}
    </div>
  );
}
