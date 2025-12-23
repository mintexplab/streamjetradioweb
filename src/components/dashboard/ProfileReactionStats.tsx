import { useUserStationStats, getReactionPersonality, getTopStations } from '@/hooks/useUserStationStats';
import { REACTION_EMOJIS } from '@/hooks/useReactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { Sparkles, Play, Flame, Waves, Frown, Moon, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileReactionStatsProps {
  userId?: string;
  showTitle?: boolean;
}

export function ProfileReactionStats({ userId, showTitle = true }: ProfileReactionStatsProps) {
  const { data: stats, isLoading } = useUserStationStats(userId);
  const { play } = useRadioPlayer();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  const personality = getReactionPersonality(stats || []);
  const topStations = getTopStations(stats || [], 5);

  // Calculate total reactions
  const totalReactions = stats?.reduce(
    (sum, s) => sum + s.fire_count + s.wave_count + s.crying_count + s.sleep_count,
    0
  ) || 0;

  // Calculate reaction breakdown
  const reactionBreakdown = {
    fire: stats?.reduce((sum, s) => sum + s.fire_count, 0) || 0,
    wave: stats?.reduce((sum, s) => sum + s.wave_count, 0) || 0,
    crying: stats?.reduce((sum, s) => sum + s.crying_count, 0) || 0,
    sleep: stats?.reduce((sum, s) => sum + s.sleep_count, 0) || 0,
  };

  const reactionIcons = {
    fire: Flame,
    wave: Waves,
    crying: Frown,
    sleep: Moon,
  };

  if (totalReactions === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          {showTitle && (
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Listening Stats
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Music className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No reactions yet</p>
            <p className="text-sm mt-1">Start listening and react to build your profile!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        {showTitle && (
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Listening Stats
          </CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reaction Personality */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
          <div className="text-4xl">{personality.emoji}</div>
          <div>
            <p className="font-bold text-lg">{personality.label}</p>
            <p className="text-sm text-muted-foreground">
              Based on {totalReactions} reactions
            </p>
          </div>
        </div>

        {/* Reaction Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Reaction Breakdown</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(reactionBreakdown) as [keyof typeof reactionBreakdown, number][]).map(
              ([type, count]) => {
                const Icon = reactionIcons[type];
                const percentage = totalReactions > 0 ? Math.round((count / totalReactions) * 100) : 0;
                
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg bg-muted/50',
                      personality.type === type && 'ring-2 ring-primary bg-primary/10'
                    )}
                  >
                    <span className="text-2xl mb-1">{REACTION_EMOJIS[type].emoji}</span>
                    <span className="text-lg font-bold">{count}</span>
                    <span className="text-xs text-muted-foreground">{percentage}%</span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Top Stations */}
        {topStations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">Favorite Stations</h4>
            <div className="space-y-2">
              {topStations.map((station, index) => {
                const stationTotal =
                  station.fire_count + station.wave_count + station.crying_count + station.sleep_count;
                const dominantReaction = Object.entries({
                  fire: station.fire_count,
                  wave: station.wave_count,
                  crying: station.crying_count,
                  sleep: station.sleep_count,
                }).reduce((a, b) => (a[1] > b[1] ? a : b))[0] as keyof typeof REACTION_EMOJIS;

                return (
                  <div
                    key={station.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
                        index === 0
                          ? 'bg-streamjet-red text-primary-foreground'
                          : index === 1
                          ? 'bg-streamjet-purple text-primary-foreground'
                          : index === 2
                          ? 'bg-streamjet-blue text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{station.station_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {stationTotal} reactions • mostly {REACTION_EMOJIS[dominantReaction].emoji}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
