import { useState, useRef, useEffect } from 'react';
import { useCountries } from '@/hooks/useRadioStations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, SlidersHorizontal } from 'lucide-react';
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
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: countries } = useCountries();

  const topCountries = countries
    ?.filter(c => c.stationcount > 100)
    .sort((a, b) => b.stationcount - a.stationcount)
    .slice(0, 50) || [];

  const hasActiveFilter = activeFilter.type !== 'none';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!value && !hasActiveFilter) setExpanded(false);
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value, hasActiveFilter]);

  const handleClear = () => {
    onChange('');
    onFilterChange('none');
    setExpanded(false);
    setShowFilters(false);
  };

  const activeLabel = hasActiveFilter
    ? activeFilter.type === 'tag'
      ? activeFilter.value
      : `🌍 ${activeFilter.value}`
    : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'relative flex items-center transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]',
            expanded ? 'w-full max-w-lg' : 'w-10'
          )}
        >
          {!expanded ? (
            <button
              onClick={() => { setExpanded(true); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="w-10 h-10 bg-secondary flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Search className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : (
            <>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="What do you want to listen to?"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                  'flex h-10 w-full bg-secondary pl-10 text-sm placeholder:text-muted-foreground',
                  'outline-none transition-all duration-300 ease-out',
                  'focus:ring-1 focus:ring-primary/40 focus:bg-accent',
                  (value || hasActiveFilter) ? 'pr-20' : 'pr-4'
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {(value || hasActiveFilter) && (
                  <button
                    onClick={handleClear}
                    className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center transition-all duration-200',
                    showFilters || hasActiveFilter
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {activeLabel && !showFilters && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/15 text-primary text-xs font-medium capitalize animate-fade-in">
            {activeLabel}
            <button onClick={() => onFilterChange('none')} className="hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {showFilters && expanded && (
        <div className="absolute top-12 left-0 right-0 max-w-lg z-50 animate-fade-in">
          <div className="bg-card border border-border p-4 shadow-lg shadow-black/10 space-y-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Genre</p>
              <div className="flex flex-wrap gap-1.5">
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
                      'px-2.5 py-1 text-xs font-medium transition-all duration-200 capitalize',
                      activeFilter.type === 'tag' && activeFilter.value === genre
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    )}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Country</p>
              <Select
                value={activeFilter.type === 'country' ? activeFilter.value : ''}
                onValueChange={(val) => { if (val) { onFilterChange('country', val); onChange(''); } }}
              >
                <SelectTrigger className="w-full h-8 border-border bg-secondary text-xs">
                  <SelectValue placeholder="Select a country..." />
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
      )}
    </div>
  );
}
