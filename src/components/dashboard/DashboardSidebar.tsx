import { useIsAdmin } from '@/hooks/useAdminRole';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'react-router-dom';
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
import { Compass, Heart, Search, Pin, Shield, BarChart3 } from 'lucide-react';
import streamjetLogo from '@/assets/streamjet-logo.svg';

interface DashboardSidebarProps {
  view: string;
  setView: (view: 'discover' | 'saved' | 'search' | 'library' | 'profile') => void;
}

export function DashboardSidebar({ view, setView }: DashboardSidebarProps) {
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const { isSubscribed } = useSubscription();

  const hasPremiumAccess = isSubscribed || profile?.is_verified;

  const navItems = [
    { id: 'discover' as const, icon: Compass, label: 'Discover' },
    { id: 'search' as const, icon: Search, label: 'Search' },
    { id: 'library' as const, icon: Pin, label: 'Your Library' },
  ];

  const libraryItems = [
    { id: 'saved' as const, icon: Heart, label: 'Liked Stations' },
  ];

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5 pb-4">
        <img src={streamjetLogo} alt="StreamJet" className="h-16 w-auto object-contain object-left" />
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

      <SidebarFooter className="p-3">
        {isAdmin && (
          <Link to="/admin">
            <SidebarMenuButton className="w-full h-9 rounded-md text-sm text-primary">
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </SidebarMenuButton>
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
