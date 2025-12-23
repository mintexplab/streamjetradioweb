import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { RadioPlayerProvider } from "@/hooks/useRadioPlayer";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PublicProfile from "./pages/PublicProfile";
import { StationPage } from "./pages/StationPage";
import ArtistPage from "./pages/ArtistPage";
import AdminDashboard from "./pages/AdminDashboard";
import PremiumAnalytics from "./pages/PremiumAnalytics";
import NotFound from "./pages/NotFound";
import { useListenerPresence } from "./hooks/useActiveListeners";
import { useFriendListeningNotifications } from "./hooks/useFriendListeningNotifications";

// Component to handle presence tracking and friend listening notifications
function PresenceTracker({ children }: { children: React.ReactNode }) {
  useListenerPresence();
  useFriendListeningNotifications();
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <SubscriptionProvider>
          <RadioPlayerProvider>
            <PresenceTracker>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Auth />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/station/:stationUuid" element={<StationPage />} />
                    <Route path="/profile/:handle" element={<PublicProfile />} />
                    <Route path="/artist/:artistId" element={<ArtistPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/premium-analytics" element={<PremiumAnalytics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </PresenceTracker>
          </RadioPlayerProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
