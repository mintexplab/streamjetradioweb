import { cn } from '@/lib/utils';
import { useStationReactions, calculateEnergy, REACTION_EMOJIS } from '@/hooks/useReactions';
import { Flame, TrendingUp, Zap } from 'lucide-react';

interface EnergyMeterProps {
  stationUuid: string;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
}

export function EnergyMeter({ stationUuid, size = 'md', showCounts = false }: EnergyMeterProps) {
  const { data: reactions, counts } = useStationReactions(stationUuid);
  const energy = calculateEnergy(reactions || []);

  const getEnergyColor = () => {
    if (energy >= 80) return 'from-streamjet-red to-orange-500';
    if (energy >= 50) return 'from-streamjet-purple to-streamjet-red';
    if (energy >= 20) return 'from-streamjet-blue to-streamjet-purple';
    return 'from-muted to-streamjet-blue';
  };

  const getEnergyLabel = () => {
    if (energy >= 80) return 'ON FIRE';
    if (energy >= 50) return 'Heating Up';
    if (energy >= 20) return 'Growing';
    return 'Chill';
  };

  const sizeClasses = {
    sm: 'h-1.5 w-16',
    md: 'h-2 w-24',
    lg: 'h-3 w-32',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {energy >= 50 ? (
          <Flame className={cn(
            'text-streamjet-red animate-pulse',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        ) : energy >= 20 ? (
          <TrendingUp className={cn(
            'text-streamjet-purple',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        ) : (
          <Zap className={cn(
            'text-muted-foreground',
            size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
          )} />
        )}
        
        <div className={cn('relative rounded-full bg-muted overflow-hidden', sizeClasses[size])}>
          <div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500',
              getEnergyColor()
            )}
            style={{ width: `${energy}%` }}
          />
        </div>

        <span className={cn(
          'font-medium',
          size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm',
          energy >= 80 ? 'text-streamjet-red' : energy >= 50 ? 'text-streamjet-purple' : 'text-muted-foreground'
        )}>
          {getEnergyLabel()}
        </span>
      </div>

      {showCounts && counts.total > 0 && (
        <div className="flex gap-2 text-xs">
          {counts.fire > 0 && <span>{REACTION_EMOJIS.fire.emoji} {counts.fire}</span>}
          {counts.wave > 0 && <span>{REACTION_EMOJIS.wave.emoji} {counts.wave}</span>}
          {counts.crying > 0 && <span>{REACTION_EMOJIS.crying.emoji} {counts.crying}</span>}
          {counts.sleep > 0 && <span>{REACTION_EMOJIS.sleep.emoji} {counts.sleep}</span>}
        </div>
      )}
    </div>
  );
}
