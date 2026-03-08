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
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Compass, Heart, User, LogOut, Users, Search, Pin, Music, Shield, BarChart3 } from 'lucide-react';
import streamjetLogo from '@/assets/streamjet-logo.png';

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

  const hasPremiumAccess = isSubscribed || profile?.is_verified;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { id: 'discover' as const, icon: Compass, label: 'Discover' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'library' as const, icon: Pin, label: 'Your Library' },
  ];

  const libraryItems = [
    { id: 'saved' as const, icon: Heart, label: 'Liked Stations' },
    { id: 'friends' as const, icon: Users, label: 'Friends' },
    { id: 'identity' as const, icon: Music, label: 'Music Identity' },
  ];

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5 pb-2">
        <img src={streamjetLogo} alt="StreamJet" className="h-7 w-auto object-contain" />
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={view === item.id}
                    onClick={() => setView(item.id)}
                    className="h-10 rounded-md font-medium"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mx-3 my-2 border-t border-border" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {libraryItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={view === item.id}
                    onClick={() => setView(item.id)}
                    className="h-9 rounded-md text-sm"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {hasPremiumAccess && (
                <SidebarMenuItem>
                  <Link to="/premium-analytics">
                    <SidebarMenuButton className="h-9 rounded-md text-sm">
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        {isAdmin && (
          <Link to="/admin">
            <SidebarMenuButton className="w-full h-9 rounded-md text-sm text-primary">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </SidebarMenuButton>
          </Link>
        )}
        <SidebarMenuButton
          onClick={() => setView('profile')}
          className="w-full h-10 rounded-md"
        >
          <Avatar className="w-6 h-6">
            <AvatarImage src={profile?.avatar_url || ''} />
            <AvatarFallback className="bg-accent text-xs">
              <User className="w-3 h-3" />
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">
            {profile?.display_name || profile?.username || user?.email?.split('@')[0]}
          </span>
        </SidebarMenuButton>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground h-8 text-xs"
          onClick={handleSignOut}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
