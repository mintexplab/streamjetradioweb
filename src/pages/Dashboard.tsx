import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTopStations, useSearchStations, useStationsByCountry, useStationsByTag } from '@/hooks/useRadioStations';
import { useSavedStations } from '@/hooks/useSavedStations';
import { usePlaylists } from '@/hooks/usePlaylists';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { PlayerBar } from '@/components/dashboard/PlayerBar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { StationFilters } from '@/components/dashboard/StationFilters';
import { PlaylistView } from '@/components/dashboard/PlaylistView';
import { ProfileView } from '@/components/dashboard/ProfileView';
import { SavedStationsView } from '@/components/dashboard/SavedStationsView';
import { SharedPlaylistView } from '@/components/dashboard/SharedPlaylistView';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type View = 'discover' | 'saved' | 'playlist' | 'profile' | 'shared';
type FilterType = { type: 'country' | 'tag' | 'none'; value?: string };

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('discover');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>({ type: 'none' });

  const { data: topStations, isLoading: loadingTop } = useTopStations(30);
  const { data: searchResults, isLoading: loadingSearch } = useSearchStations(searchQuery, 50);
  const { data: countryStations, isLoading: loadingCountry } = useStationsByCountry(
    activeFilter.type === 'country' ? activeFilter.value || '' : '',
    50
  );
  const { data: tagStations, isLoading: loadingTag } = useStationsByTag(
    activeFilter.type === 'tag' ? activeFilter.value || '' : '',
    50
  );
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
    return <Navigate to="/" replace />;
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

  // Determine which stations to show based on search and filters
  let stations = topStations || [];
  let isLoading = loadingTop;
  let title = 'Trending Stations';

  if (searchQuery) {
    stations = searchResults || [];
    isLoading = loadingSearch;
    title = 'Search Results';
  } else if (activeFilter.type === 'country' && activeFilter.value) {
    stations = countryStations || [];
    isLoading = loadingCountry;
    title = `Stations in ${activeFilter.value}`;
  } else if (activeFilter.type === 'tag' && activeFilter.value) {
    stations = tagStations || [];
    isLoading = loadingTag;
    title = `${activeFilter.value.charAt(0).toUpperCase() + activeFilter.value.slice(1)} Stations`;
  }

  const handleFilterChange = (type: 'country' | 'tag' | 'none', value?: string) => {
    setActiveFilter({ type, value });
    setSearchQuery(''); // Clear search when filtering
  };

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
              <SearchBar value={searchQuery} onChange={(v) => {
                setSearchQuery(v);
                if (v) setActiveFilter({ type: 'none' }); // Clear filter when searching
              }} />
              
              <div className="mt-6">
                <StationFilters 
                  onFilterChange={handleFilterChange} 
                  activeFilter={activeFilter} 
                />
              </div>

              <h2 className="text-2xl font-bold mb-4 mt-6">{title}</h2>
              <StationGrid
                stations={stations}
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
