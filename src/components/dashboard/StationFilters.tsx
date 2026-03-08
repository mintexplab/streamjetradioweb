import { useState } from 'react';
import { useCountries } from '@/hooks/useRadioStations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StationFiltersProps {
  onFilterChange: (type: 'country' | 'tag' | 'none', value?: string) => void;
  activeFilter: { type: 'country' | 'tag' | 'none'; value?: string };
}

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const GENRES = [
  'pop', 'rock', 'jazz', 'classical', 'hip hop', 'electronic',
  'country', 'r&b', 'latin', 'reggae', 'metal', 'indie',
  'folk', 'blues', 'soul', 'dance', 'ambient', 'news'
];

export function StationFilters({ onFilterChange, activeFilter }: StationFiltersProps) {
  const { data: countries } = useCountries();
  const [showAll, setShowAll] = useState(false);

  const topCountries = countries
    ?.filter(c => c.stationcount > 100)
    .sort((a, b) => b.stationcount - a.stationcount)
    .slice(0, 50) || [];

  const visibleGenres = showAll ? GENRES : GENRES.slice(0, 10);

  return (
    <div className="space-y-3">
      {/* Genre chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange('none')}
          className={cn(
            'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeFilter.type === 'none'
              ? 'bg-foreground text-background'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          All
        </button>
        {visibleGenres.map((genre) => (
          <button
            key={genre}
            onClick={() => {
              if (activeFilter.type === 'tag' && activeFilter.value === genre) {
                onFilterChange('none');
              } else {
                onFilterChange('tag', genre);
              }
            }}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors capitalize',
              activeFilter.type === 'tag' && activeFilter.value === genre
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            )}
          >
            {genre}
          </button>
        ))}
        {!showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="px-3.5 py-1.5 rounded-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            More...
          </button>
        )}

        {/* Country filter inline */}
        <Select
          value={activeFilter.type === 'country' ? activeFilter.value : ''}
          onValueChange={(value) => value && onFilterChange('country', value)}
        >
          <SelectTrigger className="w-auto h-8 rounded-full border-0 bg-secondary text-sm gap-1.5 px-3.5">
            <SelectValue placeholder="🌍 Country" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {topCountries.map((country) => (
              <SelectItem key={country.iso_3166_1} value={country.iso_3166_1}>
                <span className="flex items-center gap-2">
                  <span>{getCountryFlag(country.iso_3166_1)}</span>
                  <span>{country.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilter.type !== 'none' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onFilterChange('none')}
            className="h-8 rounded-full text-xs px-2"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
