import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfile } from '@/hooks/useProfile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  ArrowLeft, Crown, Lock, TrendingUp, Clock, Calendar, 
  Radio, Moon, Sun, BarChart3, Sparkles, BadgeCheck
} from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

// Extended listening stats for 1 year
function useYearlyListeningSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['yearly-listening-sessions', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data, error } = await supabase
        .from('listening_sessions')
        .select('*')
        .eq('user_id', user.id)
        .gte('started_at', oneYearAgo.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });
}

// Monthly breakdown
function useMonthlyStats(sessions: any[]) {
  const monthlyData = new Map<string, { minutes: number; sessions: number }>();

  sessions.forEach(session => {
    const date = new Date(session.started_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthlyData.get(monthKey) || { minutes: 0, sessions: 0 };
    existing.minutes += Math.round((session.duration_seconds || 0) / 60);
    existing.sessions += 1;
    monthlyData.set(monthKey, existing);
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => {
      const [year, month] = key.split('-');
      return {
        month: months[parseInt(month) - 1],
        year,
        ...value,
        hours: Math.round(value.minutes / 60 * 10) / 10,
      };
    });
}

// Station breakdown
function useStationBreakdown(sessions: any[]) {
  const stationData = new Map<string, { name: string; minutes: number; sessions: number }>();

  sessions.forEach(session => {
    const key = session.station_uuid;
    const existing = stationData.get(key) || { name: session.station_name, minutes: 0, sessions: 0 };
    existing.minutes += Math.round((session.duration_seconds || 0) / 60);
    existing.sessions += 1;
    stationData.set(key, existing);
  });

  return Array.from(stationData.values())
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 10);
}

// Time of day breakdown
function useTimeOfDayStats(sessions: any[]) {
  const hourData = new Array(24).fill(0);

  sessions.forEach(session => {
    const hour = new Date(session.started_at).getHours();
    hourData[hour] += Math.round((session.duration_seconds || 0) / 60);
  });

  return hourData.map((minutes, hour) => ({
    hour: hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`,
    minutes,
    period: hour >= 6 && hour < 18 ? 'day' : 'night',
  }));
}

// Day of week breakdown  
function useDayOfWeekStats(sessions: any[]) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayData = new Array(7).fill(0);

  sessions.forEach(session => {
    const day = new Date(session.started_at).getDay();
    dayData[day] += Math.round((session.duration_seconds || 0) / 60);
  });

  return days.map((day, i) => ({
    day,
    minutes: dayData[i],
    hours: Math.round(dayData[i] / 60 * 10) / 10,
  }));
}

export default function PremiumAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const { isSubscribed, loading: subLoading, startCheckout } = useSubscription();
  const { data: profile } = useProfile();
  const { data: sessions = [], isLoading: sessionsLoading } = useYearlyListeningSessions();

  const monthlyStats = useMonthlyStats(sessions);
  const stationBreakdown = useStationBreakdown(sessions);
  const timeOfDayStats = useTimeOfDayStats(sessions);
  const dayOfWeekStats = useDayOfWeekStats(sessions);

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0) / 60, 0);
  const totalHours = Math.round(totalMinutes / 60);
  const totalSessions = sessions.length;
  const uniqueStations = new Set(sessions.map(s => s.station_uuid)).size;
  
  const nightMinutes = timeOfDayStats.filter(t => t.period === 'night').reduce((sum, t) => sum + t.minutes, 0);
  const dayMinutes = timeOfDayStats.filter(t => t.period === 'day').reduce((sum, t) => sum + t.minutes, 0);
  const nightOwlScore = Math.round((nightMinutes / (nightMinutes + dayMinutes || 1)) * 100);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has access (subscribed OR manually verified by admin)
  const hasAccess = isSubscribed || profile?.is_verified;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Lock className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground mb-6">
              Unlock detailed analytics with 1 year of listening history by subscribing to StreamJet Premium.
            </p>
            <div className="space-y-3">
              <Button onClick={startCheckout} className="w-full">
                <Crown className="w-4 h-4 mr-2" />
                Subscribe for $4.99/month
              </Button>
              <Link to="/dashboard">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-brand">
                <Radio className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gradient-brand">StreamJet</span>
            </Link>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Premium Analytics
            </Badge>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Your Listening Analytics</h1>
          <Badge variant="outline" className="text-muted-foreground">
            <Calendar className="w-3 h-3 mr-1" />
            Last 12 Months
          </Badge>
        </div>

        {sessionsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalHours}h</p>
                      <p className="text-xs text-muted-foreground">Total Listening</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Radio className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{uniqueStations}</p>
                      <p className="text-xs text-muted-foreground">Unique Stations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {nightOwlScore > 50 ? (
                        <Moon className="w-5 h-5 text-primary" />
                      ) : (
                        <Sun className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{nightOwlScore}%</p>
                      <p className="text-xs text-muted-foreground">Night Owl Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="monthly" className="space-y-4">
              <TabsList>
                <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
                <TabsTrigger value="stations">Top Stations</TabsTrigger>
                <TabsTrigger value="time">Time Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="monthly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Monthly Listening Trend
                    </CardTitle>
                    <CardDescription>Hours listened per month over the past year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyStats}>
                          <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))' 
                            }} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="hours" 
                            stroke="hsl(var(--primary))" 
                            fillOpacity={1}
                            fill="url(#colorHours)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stations" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="w-4 h-4" />
                        Top 10 Stations
                      </CardTitle>
                      <CardDescription>Your most listened stations this year</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {stationBreakdown.map((station, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="w-6 text-muted-foreground text-sm font-medium">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{station.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(station.minutes / 60)}h · {station.sessions} sessions
                              </p>
                            </div>
                            <div 
                              className="h-2 rounded-full bg-primary/20"
                              style={{ width: `${(station.minutes / stationBreakdown[0].minutes) * 60}px` }}
                            >
                              <div 
                                className="h-full rounded-full bg-primary"
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Station Distribution</CardTitle>
                      <CardDescription>Listening time by station</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={stationBreakdown.slice(0, 5)}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="minutes"
                              nameKey="name"
                              label={({ name }) => name?.slice(0, 15) + '...'}
                              labelLine={false}
                            >
                              {stationBreakdown.slice(0, 5).map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Listening by Hour
                      </CardTitle>
                      <CardDescription>When do you listen most?</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={timeOfDayStats}>
                            <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar 
                              dataKey="minutes" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Listening by Day
                      </CardTitle>
                      <CardDescription>Your weekly listening pattern</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dayOfWeekStats}>
                            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip />
                            <Bar 
                              dataKey="hours" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
