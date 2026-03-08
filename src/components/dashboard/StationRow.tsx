import { RadioStation } from '@/hooks/useRadioStations';
import { StationCard } from './StationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight } from 'lucide-react';

interface StationRowProps {
  title: string;
  stations: RadioStation[];
  isLoading: boolean;
  onSeeAll?: () => void;
}

export function StationRow({ title, stations, isLoading, onSeeAll }: StationRowProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-fade-in">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (stations.length === 0) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
          >
            Show all
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {stations.slice(0, 5).map((station) => (
          <StationCard key={station.stationuuid} station={station} />
        ))}
      </div>
    </div>
  );
}
