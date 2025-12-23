import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
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
import { Radio, Compass, Heart, ListMusic, User, LogOut, Plus } from 'lucide-react';
import { Playlist, useCreatePlaylist } from '@/hooks/usePlaylists';
import { useToast } from '@/hooks/use-toast';

interface DashboardSidebarProps {
  view: string;
  setView: (view: 'discover' | 'saved' | 'playlist' | 'profile' | 'shared') => void;
  playlists: Playlist[];
  onSelectPlaylist: (id: string) => void;
}

export function DashboardSidebar({ view, setView, playlists, onSelectPlaylist }: DashboardSidebarProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const createPlaylist = useCreatePlaylist();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCreatePlaylist = async () => {
    try {
      const playlist = await createPlaylist.mutateAsync({
        name: `My Playlist ${(playlists?.length || 0) + 1}`,
      });
      onSelectPlaylist(playlist.id);
      toast({
        title: 'Playlist created',
        description: 'Your new playlist is ready!',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create playlist',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-brand">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-gradient-brand">StreamJet</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view === 'discover'}
                  onClick={() => setView('discover')}
                >
                  <Compass className="w-4 h-4" />
                  <span>Discover</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={view === 'saved'}
                  onClick={() => setView('saved')}
                >
                  <Heart className="w-4 h-4" />
                  <span>Saved Stations</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Playlists</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCreatePlaylist}
              disabled={createPlaylist.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton
                    isActive={view === 'playlist'}
                    onClick={() => onSelectPlaylist(playlist.id)}
                  >
                    <ListMusic className="w-4 h-4" />
                    <span className="truncate">{playlist.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {playlists.length === 0 && (
                <p className="text-sm text-muted-foreground px-3 py-2">
                  No playlists yet
                </p>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <SidebarMenuButton onClick={() => setView('profile')}>
          <User className="w-4 h-4" />
          <span className="truncate">{user?.email}</span>
        </SidebarMenuButton>
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
