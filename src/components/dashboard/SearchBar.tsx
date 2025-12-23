import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search radio stations..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 sm:pl-10 text-sm sm:text-base"
      />
    </div>
  );
}
