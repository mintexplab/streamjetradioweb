import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useAdminRole';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Radio, Compass, Heart, User, LogOut, Users, MessageSquare, Search, Pin, MapPin, Music, Shield, BarChart3, Crown } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsPopover } from './NotificationsPopover';

interface DashboardSidebarProps {
  view: string;
  setView: (view: 'discover' | 'saved' | 'feed' | 'friends' | 'search' | 'library' | 'neighborhoods' | 'identity' | 'profile') => void;
}

export function DashboardSidebar({ view, setView }: DashboardSidebarProps) {
  const { signOut, user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const { isSubscribed } = useSubscription();
  const navigate = useNavigate();

  // Check if user has premium access (subscribed or verified by admin)
  const hasPremiumAccess = isSubscribed || profile?.is_verified;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-brand">
              <Radio className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-gradient-brand">StreamJet</span>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsPopover />
            <ThemeToggle />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'discover'} onClick={() => setView('discover')}>
                  <Compass className="w-4 h-4" />
                  <span>Discover</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'feed'} onClick={() => setView('feed')}>
                  <MessageSquare className="w-4 h-4" />
                  <span>Feed</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'saved'} onClick={() => setView('saved')}>
                  <Heart className="w-4 h-4" />
                  <span>Saved Stations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'library'} onClick={() => setView('library')}>
                  <Pin className="w-4 h-4" />
                  <span>Station Library</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Social</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'friends'} onClick={() => setView('friends')}>
                  <Users className="w-4 h-4" />
                  <span>Friends</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'search'} onClick={() => setView('search')}>
                  <Search className="w-4 h-4" />
                  <span>Find Users</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'neighborhoods'} onClick={() => setView('neighborhoods')}>
                  <MapPin className="w-4 h-4" />
                  <span>Neighborhoods</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Identity</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={view === 'identity'} onClick={() => setView('identity')}>
                  <Music className="w-4 h-4" />
                  <span>Music Identity</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/premium-analytics">
                  <SidebarMenuButton className={hasPremiumAccess ? 'text-primary' : ''}>
                    {hasPremiumAccess ? (
                      <BarChart3 className="w-4 h-4" />
                    ) : (
                      <Crown className="w-4 h-4" />
                    )}
                    <span>Premium Analytics</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        {isAdmin && (
          <Link to="/admin">
            <SidebarMenuButton className="w-full text-primary">
              <Shield className="w-4 h-4" />
              <span>Admin Dashboard</span>
            </SidebarMenuButton>
          </Link>
        )}
        <SidebarMenuButton onClick={() => setView('profile')}>
          <User className="w-4 h-4" />
          <span className="truncate text-sm">{user?.email}</span>
        </SidebarMenuButton>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
