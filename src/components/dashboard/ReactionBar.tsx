import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAddReaction, useUserReaction, REACTION_EMOJIS, ReactionType } from '@/hooks/useReactions';
import { useUpdateStationStats } from '@/hooks/useUserStationStats';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReactionBarProps {
  stationUuid: string;
  stationName: string;
  compact?: boolean;
}

export function ReactionBar({ stationUuid, stationName, compact = false }: ReactionBarProps) {
  const { user } = useAuth();
  const { data: userReaction } = useUserReaction(stationUuid);
  const addReaction = useAddReaction();
  const updateStats = useUpdateStationStats();
  const [animating, setAnimating] = useState<ReactionType | null>(null);

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      toast.error('Sign in to react to stations');
      return;
    }

    setAnimating(type);
    setTimeout(() => setAnimating(null), 300);

    try {
      await addReaction.mutateAsync({
        stationUuid,
        stationName,
        reactionType: type,
      });

      // Update user stats
      await updateStats.mutateAsync({
        stationUuid,
        stationName,
        reactionType: type,
      });

      toast.success(REACTION_EMOJIS[type].label);
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const reactions = Object.entries(REACTION_EMOJIS) as [ReactionType, { emoji: string; label: string }][];

  if (compact) {
    return (
      <div className="flex gap-1">
        {reactions.map(([type, { emoji }]) => (
          <Button
            key={type}
            variant="ghost"
            size="sm"
            className={cn(
              'h-7 w-7 p-0 text-base transition-all',
              userReaction?.reaction_type === type && 'bg-primary/20 ring-1 ring-primary',
              animating === type && 'scale-125'
            )}
            onClick={() => handleReaction(type)}
          >
            {emoji}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {reactions.map(([type, { emoji, label }]) => (
        <Button
          key={type}
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 transition-all hover:scale-105',
            userReaction?.reaction_type === type && 'bg-primary/20 border-primary ring-1 ring-primary',
            animating === type && 'scale-110'
          )}
          onClick={() => handleReaction(type)}
        >
          <span className="text-base">{emoji}</span>
          <span className="text-xs hidden sm:inline">{label.split(' ').slice(-2).join(' ')}</span>
        </Button>
      ))}
    </div>
  );
}
