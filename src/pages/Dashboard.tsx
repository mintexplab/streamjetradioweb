import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTopStations, useSearchStations, RadioStation } from '@/hooks/useRadioStations';
import { useSavedStations } from '@/hooks/useSavedStations';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { PlayerBar } from '@/components/dashboard/PlayerBar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { PlaylistView } from '@/components/dashboard/PlaylistView';
import { ProfileView } from '@/components/dashboard/ProfileView';
import { SavedStationsView } from '@/components/dashboard/SavedStationsView';
import { SharedPlaylistView } from '@/components/dashboard/SharedPlaylistView';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type View = 'discover' | 'saved' | 'playlist' | 'profile' | 'shared';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('discover');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: topStations, isLoading: loadingTop } = useTopStations(30);
  const { data: searchResults, isLoading: loadingSearch } = useSearchStations(searchQuery, 50);
  const { data: savedStations } = useSavedStations();
  const { data: playlists } = usePlaylists();

  // Check for shared playlist code
  const shareCode = searchParams.get('share');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (shareCode) {
    return (
      <SidebarProvider>
        <DashboardSidebar
          view={view}
          setView={setView}
          playlists={playlists || []}
          onSelectPlaylist={(id) => {
            setSelectedPlaylistId(id);
            setView('playlist');
          }}
        />
        <SidebarInset className="pb-24">
          <SharedPlaylistView shareCode={shareCode} />
          <PlayerBar />
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const stations = searchQuery ? searchResults : topStations;
  const isLoading = searchQuery ? loadingSearch : loadingTop;

  return (
    <SidebarProvider>
      <DashboardSidebar
        view={view}
        setView={setView}
        playlists={playlists || []}
        onSelectPlaylist={(id) => {
          setSelectedPlaylistId(id);
          setView('playlist');
        }}
      />
      <SidebarInset className="pb-24">
        <div className="p-6">
          {view === 'discover' && (
            <>
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
              <h2 className="text-2xl font-bold mb-4 mt-6">
                {searchQuery ? 'Search Results' : 'Trending Stations'}
              </h2>
              <StationGrid
                stations={stations || []}
                isLoading={isLoading}
                emptyMessage={searchQuery ? 'No stations found' : 'No stations available'}
              />
            </>
          )}

          {view === 'saved' && (
            <SavedStationsView stations={savedStations || []} />
          )}

          {view === 'playlist' && selectedPlaylistId && (
            <PlaylistView playlistId={selectedPlaylistId} onBack={() => setView('discover')} />
          )}

          {view === 'profile' && <ProfileView />}
        </div>
        <PlayerBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
