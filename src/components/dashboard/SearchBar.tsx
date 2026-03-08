import { useState, useRef } from 'react';
import { useCountries } from '@/hooks/useRadioStations';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const GENRES = [
  'pop', 'rock', 'jazz', 'classical', 'hip hop', 'electronic',
  'country', 'r&b', 'latin', 'reggae', 'metal', 'indie',
  'folk', 'blues', 'soul', 'dance', 'ambient', 'news'
];

function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (type: 'country' | 'tag' | 'none', value?: string) => void;
  activeFilter: { type: 'country' | 'tag' | 'none'; value?: string };
}

export function SearchBar({ value, onChange, onFilterChange, activeFilter }: SearchBarProps) {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: countries } = useCountries();

  const topCountries = countries
    ?.filter(c => c.stationcount > 100)
    .sort((a, b) => b.stationcount - a.stationcount)
    .slice(0, 50) || [];

  const isActive = expanded || !!value || activeFilter.type !== 'none';

  const handleClear = () => {
    onChange('');
    onFilterChange('none');
    setExpanded(false);
  };

  return (
    <div className="space-y-3">
      {/* Search input row */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'relative transition-all duration-300 ease-out',
            isActive ? 'w-full max-w-xl' : 'w-full max-w-sm'
          )}
        >
          <Search
            className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
              isActive ? 'text-foreground' : 'text-muted-foreground'
            )}
          />
          <input
            ref={inputRef}
            type="text"
            placeholder="What do you want to listen to?"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setExpanded(true)}
            className={cn(
              'flex h-10 w-full rounded-full bg-secondary pl-10 pr-9 text-sm placeholder:text-muted-foreground',
              'outline-none transition-all duration-300 ease-out',
              'focus:ring-1 focus:ring-primary/40 focus:bg-accent'
            )}
          />
          {(value || activeFilter.type !== 'none') && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable filters panel */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-out',
          isActive ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onFilterChange('none')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
              activeFilter.type === 'none' && !value
                ? 'bg-foreground text-background'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            )}
          >
            All
          </button>
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => {
                if (activeFilter.type === 'tag' && activeFilter.value === genre) {
                  onFilterChange('none');
                } else {
                  onFilterChange('tag', genre);
                  onChange('');
                }
              }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 capitalize',
                activeFilter.type === 'tag' && activeFilter.value === genre
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              )}
            >
              {genre}
            </button>
          ))}

          <Select
            value={activeFilter.type === 'country' ? activeFilter.value : ''}
            onValueChange={(val) => { if (val) { onFilterChange('country', val); onChange(''); } }}
          >
            <SelectTrigger className="w-auto h-7 rounded-full border-0 bg-secondary text-xs gap-1 px-3">
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
        </div>
      </div>
    </div>
  );
}
