import { useState } from 'react';
import { useCountries, useTags, useStationsByCountry, useStationsByTag } from '@/hooks/useRadioStations';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe, Music, X } from 'lucide-react';

interface StationFiltersProps {
  onFilterChange: (type: 'country' | 'tag' | 'none', value?: string) => void;
  activeFilter: { type: 'country' | 'tag' | 'none'; value?: string };
}

// Country code to flag emoji
function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const POPULAR_TAGS = [
  'pop', 'rock', 'jazz', 'classical', 'hip hop', 'electronic', 
  'country', 'r&b', 'latin', 'reggae', 'metal', 'indie',
  'folk', 'blues', 'soul', 'dance', 'ambient', 'news'
];

export function StationFilters({ onFilterChange, activeFilter }: StationFiltersProps) {
  const { data: countries, isLoading: loadingCountries } = useCountries();
  const [showAllTags, setShowAllTags] = useState(false);

  const topCountries = countries
    ?.filter(c => c.stationcount > 100)
    .sort((a, b) => b.stationcount - a.stationcount)
    .slice(0, 50) || [];

  const displayedTags = showAllTags ? POPULAR_TAGS : POPULAR_TAGS.slice(0, 9);

  const clearFilter = () => {
    onFilterChange('none');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Country Filter */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Country:</span>
        </div>
        <Select
          value={activeFilter.type === 'country' ? activeFilter.value : ''}
          onValueChange={(value) => {
            if (value) {
              onFilterChange('country', value);
            }
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {topCountries.map((country) => (
              <SelectItem key={country.iso_3166_1} value={country.iso_3166_1}>
                <span className="flex items-center gap-2">
                  <span>{getCountryFlag(country.iso_3166_1)}</span>
                  <span>{country.name}</span>
                  <span className="text-muted-foreground text-xs">({country.stationcount})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {activeFilter.type !== 'none' && (
          <Button variant="ghost" size="sm" onClick={clearFilter}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Genre/Tag Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Genre:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {displayedTags.map((tag) => (
            <Badge
              key={tag}
              variant={activeFilter.type === 'tag' && activeFilter.value === tag ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/20 transition-colors capitalize text-xs sm:text-sm"
              onClick={() => {
                if (activeFilter.type === 'tag' && activeFilter.value === tag) {
                  onFilterChange('none');
                } else {
                  onFilterChange('tag', tag);
                }
              }}
            >
              {tag}
            </Badge>
          ))}
          {!showAllTags && (
            <Badge
              variant="secondary"
              className="cursor-pointer text-xs sm:text-sm"
              onClick={() => setShowAllTags(true)}
            >
              +{POPULAR_TAGS.length - 9} more
            </Badge>
          )}
          {showAllTags && (
            <Badge
              variant="secondary"
              className="cursor-pointer text-xs sm:text-sm"
              onClick={() => setShowAllTags(false)}
            >
              Show less
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
