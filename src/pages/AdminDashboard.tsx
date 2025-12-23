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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Radio, Users, MessageSquare, BarChart3, Shield, Trash2, 
  BadgeCheck, Search, ArrowLeft, User, AlertTriangle, Ban, 
  Crown, UserCheck, Sparkles
} from 'lucide-react';

type AppRole = 'admin' | 'moderator' | 'user';

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
        { data: recentSessions },
        { count: verifiedCount },
        { count: bannedCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('saved_stations').select('*', { count: 'exact', head: true }),
        supabase.from('station_chat_messages').select('*', { count: 'exact', head: true }),
        supabase.from('listening_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('listening_sessions')
          .select('duration_seconds')
          .not('duration_seconds', 'is', null)
          .limit(1000),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      ]);

      const totalListenTime = recentSessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;

      return {
        users: userCount || 0,
        savedStations: stationCount || 0,
        chatMessages: messageCount || 0,
        sessions: sessionCount || 0,
        totalListenHours: Math.round(totalListenTime / 3600),
        verifiedUsers: verifiedCount || 0,
        bannedUsers: bannedCount || 0,
      };
    },
  });
}

// All users for management with their roles
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

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Get roles for all users
      const userIds = profiles?.map(p => p.user_id) || [];
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]));

      return profiles?.map(p => ({
        ...p,
        role: roleMap.get(p.user_id) || 'user',
      })) || [];
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
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] });
      toast({ title: isVerified ? 'User verified!' : 'Verification removed' });
    },
    onError: () => {
      toast({ title: 'Failed to update verification', variant: 'destructive' });
    },
  });
}

// Ban/unban user
function useBanUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isBanned, reason }: { userId: string; isBanned: boolean; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_banned: isBanned,
          banned_at: isBanned ? new Date().toISOString() : null,
          ban_reason: isBanned ? reason : null,
        })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, { isBanned }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] });
      toast({ title: isBanned ? 'User banned' : 'User unbanned' });
    },
    onError: () => {
      toast({ title: 'Failed to update ban status', variant: 'destructive' });
    },
  });
}

// Update user role
function useUpdateRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      // First delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Then insert new role
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'Role updated!' });
    },
    onError: () => {
      toast({ title: 'Failed to update role', variant: 'destructive' });
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
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] });
      toast({ title: 'Message deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete message', variant: 'destructive' });
    },
  });
}

// Ban Dialog Component
function BanDialog({ user, onBan }: { user: any; onBan: (reason: string) => void }) {
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);

  const handleBan = () => {
    onBan(reason);
    setOpen(false);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Ban className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            Ban {user.display_name || user.username || 'this user'} from the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ban-reason">Reason (optional)</Label>
            <Textarea
              id="ban-reason"
              placeholder="Enter reason for ban..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleBan}>Ban User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'admin':
      return <Crown className="w-3 h-3" />;
    case 'moderator':
      return <Shield className="w-3 h-3" />;
    default:
      return <User className="w-3 h-3" />;
  }
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case 'admin':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'moderator':
      return 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [userSearch, setUserSearch] = useState('');
  const [chatSearch, setChatSearch] = useState('');

  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { data: users, isLoading: usersLoading } = useAllUsers(userSearch);
  const { data: messages, isLoading: messagesLoading } = useChatMessages(chatSearch);
  const toggleVerified = useToggleVerified();
  const banUser = useBanUser();
  const updateRole = useUpdateRole();
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
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
                  <BadgeCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.verifiedUsers}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <Ban className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{statsLoading ? '-' : stats?.bannedUsers}</p>
                  <p className="text-xs text-muted-foreground">Banned</p>
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
                  <p className="text-xs text-muted-foreground">Saved</p>
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
                  <p className="text-xs text-muted-foreground">Messages</p>
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

        {/* Subscription Info Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold flex items-center gap-2">
                  StreamJet Premium
                  <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 dark:text-amber-400">Coming Soon</Badge>
                </h3>
                <p className="text-sm text-muted-foreground">
                  Premium subscription will include verified badge and detailed analytics going back 1 year.
                  Stripe integration pending.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <CardDescription>Manage users, roles, verification, and bans</CardDescription>
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
                      <div 
                        key={profile.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          profile.is_banned 
                            ? 'border-destructive/50 bg-destructive/5' 
                            : 'border-border'
                        }`}
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={profile.avatar_url || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <User className="w-5 h-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">
                              {profile.display_name || profile.username || 'Anonymous'}
                            </p>
                            {profile.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-primary fill-primary/20" />
                            )}
                            {profile.is_banned && (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            )}
                            <Badge variant="outline" className={`text-xs ${getRoleBadgeVariant(profile.role)}`}>
                              {getRoleIcon(profile.role)}
                              <span className="ml-1 capitalize">{profile.role}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            @{profile.username || 'no-username'}
                          </p>
                        </div>

                        {/* Role selector */}
                        <Select
                          value={profile.role}
                          onValueChange={(value: AppRole) => 
                            updateRole.mutate({ userId: profile.user_id, role: value })
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3" />
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex items-center gap-2">
                                <Shield className="w-3 h-3" />
                                Moderator
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Crown className="w-3 h-3" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Verified toggle */}
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`verified-${profile.id}`} className="text-sm sr-only">
                            Verified
                          </Label>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={profile.is_verified ? 'text-primary' : 'text-muted-foreground'}
                            onClick={() => 
                              toggleVerified.mutate({ userId: profile.user_id, isVerified: !profile.is_verified })
                            }
                            title={profile.is_verified ? 'Remove verification' : 'Verify user'}
                          >
                            <BadgeCheck className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Ban/Unban */}
                        {profile.is_banned ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                            onClick={() => banUser.mutate({ userId: profile.user_id, isBanned: false })}
                            title="Unban user"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        ) : (
                          <BanDialog 
                            user={profile} 
                            onBan={(reason) => banUser.mutate({ userId: profile.user_id, isBanned: true, reason })}
                          />
                        )}
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