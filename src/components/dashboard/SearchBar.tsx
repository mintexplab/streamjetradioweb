import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-lg">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="What do you want to listen to?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-10 rounded-full bg-secondary border-0 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-foreground/20"
      />
    </div>
  );
}
