import { useActiveListeners } from '@/hooks/useActiveListeners';
import { cn } from '@/lib/utils';
import { Radio, Users } from 'lucide-react';

interface LiveListenersBadgeProps {
  stationUuid: string;
  size?: 'sm' | 'md';
}

export function LiveListenersBadge({ stationUuid, size = 'sm' }: LiveListenersBadgeProps) {
  const { data: listeners } = useActiveListeners(stationUuid);
  const count = listeners?.length || 0;

  if (count === 0) return null;

  return (
    <div className={cn(
      'flex items-center gap-1 rounded-full bg-streamjet-red/10 text-streamjet-red',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    )}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-streamjet-red opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-streamjet-red" />
      </span>
      <span className="font-medium">{count}</span>
      {size === 'md' && <span>listening</span>}
    </div>
  );
}

export function GlobalListenerCount({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4" />
      <span>{count} listening now</span>
    </div>
  );
}
