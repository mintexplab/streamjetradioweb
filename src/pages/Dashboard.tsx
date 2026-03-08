import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTopStations, useSearchStations, useStationsByCountry, useStationsByTag } from '@/hooks/useRadioStations';
import { useSavedStations } from '@/hooks/useSavedStations';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { PlayerBar } from '@/components/dashboard/PlayerBar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { StationFilters } from '@/components/dashboard/StationFilters';
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

  const { data: topStations, isLoading: loadingTop } = useTopStations(30);
  const { data: searchResults, isLoading: loadingSearch } = useSearchStations(searchQuery, 50);
  const { data: countryStations, isLoading: loadingCountry } = useStationsByCountry(
    activeFilter.type === 'country' ? activeFilter.value || '' : '', 50
  );
  const { data: tagStations, isLoading: loadingTag } = useStationsByTag(
    activeFilter.type === 'tag' ? activeFilter.value || '' : '', 50
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

  let stations = topStations || [];
  let isLoading = loadingTop;
  let title = 'Popular right now';

  if (searchQuery) {
    stations = searchResults || [];
    isLoading = loadingSearch;
    title = `Results for "${searchQuery}"`;
  } else if (activeFilter.type === 'country' && activeFilter.value) {
    stations = countryStations || [];
    isLoading = loadingCountry;
    title = `Stations in ${activeFilter.value}`;
  } else if (activeFilter.type === 'tag' && activeFilter.value) {
    stations = tagStations || [];
    isLoading = loadingTag;
    title = `${activeFilter.value.charAt(0).toUpperCase() + activeFilter.value.slice(1)}`;
  }

  const handleFilterChange = (type: 'country' | 'tag' | 'none', value?: string) => {
    setActiveFilter({ type, value });
    setSearchQuery('');
  };

  return (
    <SidebarProvider>
      <DashboardSidebar view={view} setView={setView} />
      <SidebarInset className="pb-20 sm:pb-24">
        <MobileHeader />
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">
          {view === 'discover' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <SearchBar
                  value={searchQuery}
                  onChange={(v) => {
                    setSearchQuery(v);
                    if (v) setActiveFilter({ type: 'none' });
                  }}
                />
              </div>

              <StationFilters onFilterChange={handleFilterChange} activeFilter={activeFilter} />

              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">{title}</h2>
                <StationGrid
                  stations={stations}
                  isLoading={isLoading}
                  emptyMessage={searchQuery ? 'No stations found' : 'No stations available'}
                />
              </div>
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
        <PlayerBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
