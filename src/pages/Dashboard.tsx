import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTopStations, useSearchStations, useStationsByCountry, useStationsByTag } from '@/hooks/useRadioStations';
import { useSavedStations } from '@/hooks/useSavedStations';
import { useGlobalListenerCount } from '@/hooks/useActiveListeners';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { StationGrid } from '@/components/dashboard/StationGrid';
import { PlayerBar } from '@/components/dashboard/PlayerBar';
import { SearchBar } from '@/components/dashboard/SearchBar';
import { StationFilters } from '@/components/dashboard/StationFilters';
import { ProfileView } from '@/components/dashboard/ProfileView';
import { SavedStationsView } from '@/components/dashboard/SavedStationsView';
import { TrendingStations } from '@/components/dashboard/TrendingStations';
import { PostFeed } from '@/components/dashboard/PostFeed';
import { FriendsList } from '@/components/dashboard/FriendsList';
import { UserSearch } from '@/components/dashboard/UserSearch';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { StationLibrary } from '@/components/dashboard/StationLibrary';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Navigate } from 'react-router-dom';
import { Loader2, Users } from 'lucide-react';

type View = 'discover' | 'saved' | 'feed' | 'friends' | 'search' | 'library' | 'profile';
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
  const { data: globalListenerCount } = useGlobalListenerCount();

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
    setSearchQuery('');
  };

  return (
    <SidebarProvider>
      <DashboardSidebar view={view} setView={setView} />
      <SidebarInset className="pb-20 sm:pb-24">
        <MobileHeader />
        <div className="p-4 sm:p-6">
          {view === 'discover' && (
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 min-w-0">
                <SearchBar value={searchQuery} onChange={(v) => {
                  setSearchQuery(v);
                  if (v) setActiveFilter({ type: 'none' });
                }} />
                <div className="mt-4 sm:mt-6">
                  <StationFilters onFilterChange={handleFilterChange} activeFilter={activeFilter} />
                </div>
                {globalListenerCount && globalListenerCount > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{globalListenerCount} people listening right now</span>
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-6">{title}</h2>
                <StationGrid stations={stations} isLoading={isLoading} emptyMessage={searchQuery ? 'No stations found' : 'No stations available'} />
              </div>
              <div className="hidden lg:block w-80 shrink-0 space-y-6">
                <div className="sticky top-6 space-y-6">
                  <ActivityFeed />
                  <TrendingStations />
                </div>
              </div>
            </div>
          )}
          {view === 'feed' && <PostFeed />}
          {view === 'saved' && <SavedStationsView stations={savedStations || []} />}
          {view === 'library' && <StationLibrary />}
          {view === 'friends' && <FriendsList />}
          {view === 'search' && <UserSearch />}
          {view === 'profile' && <ProfileView />}
        </div>
        <PlayerBar />
      </SidebarInset>
    </SidebarProvider>
  );
}
