import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchStations, useStationsByTag, useStationsByCountry } from '@/hooks/useRadioStations';
import { useSavedStations } from '@/hooks/useSavedStations';
import { useStationsByGenres } from '@/hooks/useStationsByGenres';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StationRow } from '@/components/dashboard/StationRow';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { PlayerBar } from '@/components/dashboard/PlayerBar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { ProfileView } from '@/components/dashboard/ProfileView';
import { SavedStationsView } from '@/components/dashboard/SavedStationsView';
import { PostFeed } from '@/components/dashboard/PostFeed';
import { FriendsList } from '@/components/dashboard/FriendsList';
import { UserSearch } from '@/components/dashboard/UserSearch';
import { StationLibrary } from '@/components/dashboard/StationLibrary';
import { NeighborhoodsView } from '@/components/dashboard/NeighborhoodsView';
import { MusicIdentityEditor } from '@/components/dashboard/MusicIdentityEditor';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type View = 'discover' | 'saved' | 'feed' | 'friends' | 'search' | 'library' | 'neighborhoods' | 'identity' | 'profile';
type FilterType = { type: 'country' | 'tag' | 'none'; value?: string };

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [view, setView] = useState<View>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>({ type: 'none' });

  const genreRows = useStationsByGenres();
  const { data: searchResults, isLoading: loadingSearch } = useSearchStations(searchQuery, 20);
  const { data: tagStations, isLoading: loadingTag } = useStationsByTag(
    activeFilter.type === 'tag' ? activeFilter.value || '' : '', 20
  );
  const { data: countryStations, isLoading: loadingCountry } = useStationsByCountry(
    activeFilter.type === 'country' ? activeFilter.value || '' : '', 20
  );
  const { data: savedStations } = useSavedStations();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const handleFilterChange = (type: 'country' | 'tag' | 'none', value?: string) => {
    setActiveFilter({ type, value });
    setSearchQuery('');
  };

  const isFilterActive = searchQuery || activeFilter.type !== 'none';

  let filteredStations: any[] = [];
  let filteredLoading = false;
  let filteredTitle = '';

  if (searchQuery) {
    filteredStations = searchResults || [];
    filteredLoading = loadingSearch;
    filteredTitle = `Results for "${searchQuery}"`;
  } else if (activeFilter.type === 'tag' && activeFilter.value) {
    filteredStations = tagStations || [];
    filteredLoading = loadingTag;
    filteredTitle = activeFilter.value.charAt(0).toUpperCase() + activeFilter.value.slice(1);
  } else if (activeFilter.type === 'country' && activeFilter.value) {
    filteredStations = countryStations || [];
    filteredLoading = loadingCountry;
    filteredTitle = `Stations in ${activeFilter.value}`;
  }

  return (
    <SidebarProvider>
      <DashboardSidebar view={view} setView={setView} />
      <SidebarInset className="pb-20 sm:pb-24">
        <MobileHeader />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">
          <div key={view} className="animate-fade-in">
            {view === 'discover' && (
              <div className="space-y-8">
                <SearchBar
                  value={searchQuery}
                  onChange={(v) => {
                    setSearchQuery(v);
                    if (v) setActiveFilter({ type: 'none' });
                  }}
                  onFilterChange={handleFilterChange}
                  activeFilter={activeFilter}
                />

                {isFilterActive ? (
                  <div className="animate-fade-in">
                    <h2 className="text-2xl font-bold tracking-tight mb-4">{filteredTitle}</h2>
                    <StationGrid
                      stations={filteredStations}
                      isLoading={filteredLoading}
                      emptyMessage={searchQuery ? 'No stations found' : 'No stations available'}
                    />
                  </div>
                ) : (
                  <div className="space-y-8">
                    {genreRows.map((row, i) => (
                      <div key={row.label} style={{ animationDelay: `${i * 60}ms` }} className="animate-fade-in">
                        <StationRow
                          title={row.label}
                          stations={row.stations}
                          isLoading={row.isLoading}
                          onSeeAll={() => {
                            if (row.tag) handleFilterChange('tag', row.tag);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {view === 'feed' && <PostFeed />}
            {view === 'saved' && <SavedStationsView stations={savedStations || []} />}
            {view === 'library' && <StationLibrary />}
            {view === 'friends' && <FriendsList />}
            {view === 'search' && <UserSearch />}
            {view === 'neighborhoods' && <NeighborhoodsView />}
            {view === 'identity' && <MusicIdentityEditor />}
            {view === 'profile' && <ProfileView />}
          </div>
        </div>
        <PlayerBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
