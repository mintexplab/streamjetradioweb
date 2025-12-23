import { useStationReactions, REACTION_EMOJIS } from '@/hooks/useReactions';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface VibePulseProps {
  stationUuid: string;
  className?: string;
}

export function VibePulse({ stationUuid, className }: VibePulseProps) {
  const { data: reactions, counts } = useStationReactions(stationUuid);

  if (!reactions?.length || counts.total === 0) return null;

  // Get reactions from last 10 minutes
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentReactions = reactions.filter(r => new Date(r.created_at) > tenMinutesAgo);

  if (recentReactions.length === 0) return null;

  // Find the dominant reaction type
  const recentCounts = {
    fire: recentReactions.filter(r => r.reaction_type === 'fire').length,
    wave: recentReactions.filter(r => r.reaction_type === 'wave').length,
    crying: recentReactions.filter(r => r.reaction_type === 'crying').length,
    sleep: recentReactions.filter(r => r.reaction_type === 'sleep').length,
  };

  const dominant = Object.entries(recentCounts).reduce((a, b) => (a[1] > b[1] ? a : b));
  const dominantEmoji = REACTION_EMOJIS[dominant[0] as keyof typeof REACTION_EMOJIS].emoji;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20',
      'animate-fade-in',
      className
    )}>
      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
      <span className="text-xs font-medium">
        {recentReactions.length} listeners reacted {dominantEmoji} in the last 10 min
      </span>
    </div>
  );
}

// Compact version for station cards
export function VibePulseBadge({ stationUuid }: { stationUuid: string }) {
  const { counts } = useStationReactions(stationUuid);

  if (counts.total === 0) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Sparkles className="h-3 w-3 text-primary" />
      <span>{counts.total}</span>
    </div>
  );
}
