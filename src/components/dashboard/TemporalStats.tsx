import React from 'react';
import { useTemporalStats, useStationAffinity } from '@/hooks/useListeningSessions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Moon, Sun, Calendar, Clock, TrendingUp, BarChart3 } from 'lucide-react';

interface TemporalStatsProps {
  userId?: string;
  compact?: boolean;
}

export function TemporalStats({ userId, compact = false }: TemporalStatsProps) {
  const stats = useTemporalStats(userId);
  const affinity = useStationAffinity(userId);
  const topStations = affinity.slice(0, 5);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const maxHourMinutes = Math.max(...stats.byHour.map(h => h.minutes)) || 1;
  const maxDayMinutes = Math.max(...stats.byDay.map(d => d.minutes)) || 1;

  // Calculate weekday vs weekend ratio
  const weekendMinutes = stats.byDay[0]?.minutes + stats.byDay[6]?.minutes || 0;
  const weekdayMinutes = stats.byDay.slice(1, 6).reduce((sum, d) => sum + d.minutes, 0) || 0;
  const totalMinutes = weekendMinutes + weekdayMinutes;
  const weekendPercentage = totalMinutes > 0 ? Math.round((weekendMinutes / totalMinutes) * 100) : 0;

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            {stats.nightOwlIndex > 50 ? (
              <Moon className="w-6 h-6 text-primary mx-auto mb-1" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-500 mx-auto mb-1" />
            )}
            <p className="text-lg font-bold">{stats.nightOwlIndex}%</p>
            <p className="text-xs text-muted-foreground">Night Owl</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">
              {stats.peakHour !== null ? formatHour(stats.peakHour) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">Peak Hour</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold">{weekendPercentage}%</p>
            <p className="text-xs text-muted-foreground">Weekend</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Weekend Ratio</p>
              <p className="text-2xl font-bold">{weekendPercentage}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Time</p>
              <p className="text-2xl font-bold">{Math.round(totalMinutes / 60)}h</p>
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
          {weekendPercentage < 20 && (
            <Badge variant="secondary">💼 Weekday Worker</Badge>
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
          {stats.peakHour !== null && stats.peakHour >= 5 && stats.peakHour <= 9 && (
            <Badge variant="secondary">☕ Morning Commuter</Badge>
          )}
          {stats.peakHour !== null && stats.peakHour >= 17 && stats.peakHour <= 20 && (
            <Badge variant="secondary">🚗 Evening Commuter</Badge>
          )}
        </CardContent>
      </Card>

      {/* Listening by Hour */}
      {stats.byHour.some(h => h.minutes > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Listening by Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end h-24 gap-0.5">
              {stats.byHour.map((hour) => {
                const height = (hour.minutes / maxHourMinutes) * 100;
                const isNight = hour.hour >= 22 || hour.hour < 6;
                
                return (
                  <div 
                    key={hour.hour} 
                    className="flex-1 flex flex-col items-center justify-end group relative"
                  >
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isNight ? 'bg-primary/60' : 'bg-primary'
                      }`}
                      style={{ height: `${Math.max(height, 2)}%` }}
                    />
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap z-10">
                      {formatHour(hour.hour)}: {hour.minutes}m
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1 text-xs text-muted-foreground">
              <span>12AM</span>
              <span>6AM</span>
              <span>12PM</span>
              <span>6PM</span>
              <span>12AM</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Listening by Day */}
      {stats.byDay.some(d => d.minutes > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Weekday vs Weekend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-end h-20 gap-2">
              {stats.byDay.map((day, index) => {
                const height = (day.minutes / maxDayMinutes) * 100;
                const isWeekend = index === 0 || index === 6;
                
                return (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div 
                      className={`w-full rounded-t transition-all ${
                        isWeekend ? 'bg-primary' : 'bg-primary/50'
                      }`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className={`text-xs ${isWeekend ? 'font-medium' : 'text-muted-foreground'}`}>
                      {day.day}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-popover text-popover-foreground px-2 py-1 rounded text-xs shadow-lg whitespace-nowrap z-10">
                      {day.minutes}m
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                <span className="w-5 text-muted-foreground text-sm font-medium">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{station.station_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.total_minutes} min · {station.session_count} sessions
                  </p>
                </div>
                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(station.total_minutes / topStations[0].total_minutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
