import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Radio, Users, MessageSquare, BarChart3, Shield, Trash2, 
  BadgeCheck, Search, ArrowLeft, User, AlertTriangle
} from 'lucide-react';

// Platform stats
function usePlatformStats() {
  return useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: async () => {
      const [
        { count: userCount },
        { count: stationCount },
        { count: messageCount },
        { count: sessionCount },
        { data: recentSessions }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('saved_stations').select('*', { count: 'exact', head: true }),
        supabase.from('station_chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('listening_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('listening_sessions')
          .select('duration_seconds')
          .not('duration_seconds', 'is', null)
          .limit(1000)
      ]);

      const totalListenTime = recentSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;

      return {
        users: userCount || 0,
        savedStations: stationCount || 0,
        chatMessages: messageCount || 0,
        sessions: sessionCount || 0,
        totalListenHours: Math.round(totalListenTime / 3600),
      };
    },
  });
}

// All users for management
function useAllUsers(search: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

// Chat messages for moderation
function useChatMessages(search: string) {
  return useQuery({
    queryKey: ['admin-chat-messages', search],
    queryFn: async () => {
      let query = supabase
        .from('station_chat_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Get user profiles for the messages
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      return data?.map(m => ({
        ...m,
        profile: profileMap.get(m.user_id),
      })) || [];
    },
  });
}

// Toggle verified status
function useToggleVerified() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: isVerified })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { isVerified }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: isVerified ? 'User verified!' : 'Verification removed' });
    },
    onError: () => {
      toast({ title: 'Failed to update verification', variant: 'destructive' });
    },
  });
}

// Delete chat message
function useDeleteMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from('station_chat_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chat-messages'] });
      toast({ title: 'Message deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    },
  });
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [userSearch, setUserSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');
  const { toast } = useToast();

  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: users, isLoading: usersLoading } = useAllUsers(userSearch);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(chatSearch);
  const toggleVerified = useToggleVerified();
  const deleteMessage = useDeleteMessage();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access the admin dashboard.
            </p>
            <Link to="/dashboard">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
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
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.users}</p>
                  <p className="text-xs text-muted-foreground">Users</p>
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
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.savedStations}</p>
                  <p className="text-xs text-muted-foreground">Saved Stations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.chatMessages}</p>
                  <p className="text-xs text-muted-foreground">Chat Messages</p>
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
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.sessions}</p>
                  <p className="text-xs text-muted-foreground">Sessions</p>
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
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.totalListenHours}h</p>
                  <p className="text-xs text-muted-foreground">Listen Time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat Moderation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and verification status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {usersLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {users?.map((profile) => (
                      <div key={profile.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile.avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {profile.display_name || profile.username || 'Anonymous'}
                            </p>
                            {profile.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            @{profile.username || 'no-username'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`verified-${profile.id}`} className="text-sm">
                            Verified
                          </Label>
                          <Switch
                            id={`verified-${profile.id}`}
                            checked={profile.is_verified}
                            onCheckedChange={(checked) => 
                              toggleVerified.mutate({ userId: profile.user_id, isVerified: checked })
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Chat Moderation</CardTitle>
                <CardDescription>Review and moderate station chat messages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {messagesLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : messages?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No messages found</p>
                ) : (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {messages?.map((message) => (
                      <div key={message.id} className="flex items-start gap-3 p-3 rounded-lg border border-border">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.profile?.avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm">
                              {message.profile?.display_name || message.profile?.username || 'Anonymous'}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {message.station_name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm break-words">{message.content}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMessage.mutate(message.id)}
                          disabled={deleteMessage.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
