import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { cn } from '@/lib/utils';
import { Radio } from 'lucide-react';

interface CurrentlyListeningBadgeProps {
  className?: string;
  showStation?: boolean;
}

export function CurrentlyListeningBadge({ className, showStation = true }: CurrentlyListeningBadgeProps) {
  const { currentStation, isPlaying } = useRadioPlayer();

  if (!currentStation || !isPlaying) return null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-brand text-primary-foreground',
      className
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
      </span>
      <Radio className="h-3 w-3" />
      {showStation && (
        <span className="text-xs font-medium truncate max-w-32">{currentStation.name}</span>
      )}
    </div>
  );
}
