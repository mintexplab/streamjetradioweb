import { useTemporalStats, useStationAffinity } from '@/hooks/useListeningSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Calendar, Clock, TrendingUp } from 'lucide-react';

interface ListeningStatsProps {
  userId?: string;
}

export function ListeningStats({ userId }: ListeningStatsProps) {
  const stats = useTemporalStats(userId);
  const affinity = useStationAffinity(userId);

  const topStations = affinity.slice(0, 5);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            {stats.nightOwlIndex > 50 ? (
              <Moon className="w-8 h-8 text-primary" />
            ) : (
              <Sun className="w-8 h-8 text-yellow-500" />
            )}
            <div>
              <p className="text-sm text-muted-foreground">Night Owl Index</p>
              <p className="text-2xl font-bold">{stats.nightOwlIndex}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Peak Hour</p>
              <p className="text-2xl font-bold">
                {stats.peakHour !== null ? formatHour(stats.peakHour) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vibe Tags */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Your Vibe
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {stats.nightOwlIndex > 60 && (
            <Badge variant="secondary">🦉 Night Owl</Badge>
          )}
          {stats.nightOwlIndex < 30 && (
            <Badge variant="secondary">☀️ Early Bird</Badge>
          )}
          {stats.weekendWarrior && (
            <Badge variant="secondary">🎉 Weekend Warrior</Badge>
          )}
          {topStations.length > 3 && (
            <Badge variant="secondary">🎧 Station Hopper</Badge>
          )}
          {topStations.length === 1 && topStations[0]?.session_count > 5 && (
            <Badge variant="secondary">💎 Loyal Listener</Badge>
          )}
          {topStations.length === 0 && (
            <Badge variant="secondary">🆕 New Explorer</Badge>
          )}
        </CardContent>
      </Card>

      {/* Top Stations */}
      {topStations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Stations (90 days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topStations.map((station, i) => (
              <div 
                key={station.station_uuid}
                className="flex items-center gap-3"
              >
                <span className="w-5 text-muted-foreground text-sm">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{station.station_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.total_minutes} min · {station.session_count} sessions
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Listening by Day */}
      {stats.byDay.some(d => d.minutes > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Listening by Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-20 gap-1">
              {stats.byDay.map((day) => {
                const maxMinutes = Math.max(...stats.byDay.map(d => d.minutes)) || 1;
                const height = (day.minutes / maxMinutes) * 100;
                
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                    <div 
                      className="w-full bg-primary/20 rounded-t relative overflow-hidden"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    >
                      <div 
                        className="absolute bottom-0 w-full bg-primary rounded-t transition-all"
                        style={{ height: '100%' }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{day.day[0]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
