import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        focused ? 'w-full max-w-xl' : 'w-full max-w-sm'
      )}
    >
      <Search
        className={cn(
          'absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200',
          focused ? 'text-foreground' : 'text-muted-foreground'
        )}
      />
      <Input
        ref={inputRef}
        type="search"
        placeholder="What do you want to listen to?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          'pl-10 pr-9 h-10 rounded-full bg-secondary border-0 text-sm placeholder:text-muted-foreground',
          'transition-all duration-300 ease-out',
          'focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:bg-accent'
        )}
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
