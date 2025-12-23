import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SpotifyAuthContextType {
  isConnected: boolean;
  isConnecting: boolean;
  isPremium: boolean;
  accessToken: string | null;
  spotifyUser: SpotifyUser | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshToken: () => Promise<string | null>;
}

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
  product: string; // 'premium' | 'free' | 'open'
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | undefined>(undefined);

const SPOTIFY_STORAGE_KEY = 'streamjet_spotify_auth';
const SPOTIFY_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
].join(' ');

export function SpotifyAuthProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);
  const [tokenExpiry, setTokenExpiry] = useState<number | null>(null);
  const [spotifyUser, setSpotifyUser] = useState<SpotifyUser | null>(null);

  // Load stored auth on mount
  useEffect(() => {
    const stored = localStorage.getItem(SPOTIFY_STORAGE_KEY);
    if (stored && user) {
      try {
        const data = JSON.parse(stored);
        if (data.userId === user.id) {
          setAccessToken(data.accessToken);
          setRefreshTokenValue(data.refreshToken);
          setTokenExpiry(data.tokenExpiry);
          setIsConnected(true);
          // Fetch user info
          fetchSpotifyUser(data.accessToken);
        }
      } catch {
        localStorage.removeItem(SPOTIFY_STORAGE_KEY);
      }
    }
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const storedState = sessionStorage.getItem('spotify_auth_state');

      if (code && state && state === storedState) {
        setIsConnecting(true);
        sessionStorage.removeItem('spotify_auth_state');
        
        // Clean URL
        window.history.replaceState({}, '', window.location.pathname);

        try {
          const { data, error } = await supabase.functions.invoke('spotify-auth', {
            body: {
              action: 'exchange_code',
              code,
              redirect_uri: `${window.location.origin}/player`,
            },
          });

          if (error) throw error;

          const expiry = Date.now() + (data.expires_in * 1000);
          
          setAccessToken(data.access_token);
          setRefreshTokenValue(data.refresh_token);
          setTokenExpiry(expiry);
          setIsConnected(true);

          // Fetch user info
          await fetchSpotifyUser(data.access_token);

          // Store in localStorage
          if (user) {
            localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify({
              userId: user.id,
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              tokenExpiry: expiry,
            }));
          }
        } catch (err) {
          console.error('Failed to exchange Spotify code:', err);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    handleCallback();
  }, [user]);

  const fetchSpotifyUser = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setSpotifyUser(userData);
        setIsPremium(userData.product === 'premium');
      }
    } catch (err) {
      console.error('Failed to fetch Spotify user:', err);
    }
  };

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!refreshTokenValue) return null;

    try {
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: {
          action: 'refresh_token',
          refresh_token: refreshTokenValue,
        },
      });

      if (error) throw error;

      const expiry = Date.now() + (data.expires_in * 1000);
      
      setAccessToken(data.access_token);
      if (data.refresh_token) {
        setRefreshTokenValue(data.refresh_token);
      }
      setTokenExpiry(expiry);

      // Update storage
      if (user) {
        localStorage.setItem(SPOTIFY_STORAGE_KEY, JSON.stringify({
          userId: user.id,
          accessToken: data.access_token,
          refreshToken: data.refresh_token || refreshTokenValue,
          tokenExpiry: expiry,
        }));
      }

      return data.access_token;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      disconnect();
      return null;
    }
  }, [refreshTokenValue, user]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!tokenExpiry || !isConnected) return;

    const refreshBuffer = 5 * 60 * 1000; // 5 minutes before expiry
    const timeUntilRefresh = tokenExpiry - Date.now() - refreshBuffer;

    if (timeUntilRefresh <= 0) {
      refreshToken();
      return;
    }

    const timer = setTimeout(refreshToken, timeUntilRefresh);
    return () => clearTimeout(timer);
  }, [tokenExpiry, isConnected, refreshToken]);

  const connect = async () => {
    setIsConnecting(true);
    
    try {
      // Get client ID from edge function
      const { data, error } = await supabase.functions.invoke('spotify-auth', {
        body: { action: 'get_client_id' },
      });

      if (error) throw error;

      const state = crypto.randomUUID();
      sessionStorage.setItem('spotify_auth_state', state);

      const authUrl = new URL('https://accounts.spotify.com/authorize');
      authUrl.searchParams.set('client_id', data.client_id);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', `${window.location.origin}/player`);
      authUrl.searchParams.set('scope', SPOTIFY_SCOPES);
      authUrl.searchParams.set('state', state);

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Failed to initiate Spotify auth:', err);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccessToken(null);
    setRefreshTokenValue(null);
    setTokenExpiry(null);
    setSpotifyUser(null);
    setIsConnected(false);
    setIsPremium(false);
    localStorage.removeItem(SPOTIFY_STORAGE_KEY);
  };

  return (
    <SpotifyAuthContext.Provider
      value={{
        isConnected,
        isConnecting,
        isPremium,
        accessToken,
        spotifyUser,
        connect,
        disconnect,
        refreshToken,
      }}
    >
      {children}
    </SpotifyAuthContext.Provider>
  );
}

export function useSpotifyAuth() {
  const context = useContext(SpotifyAuthContext);
  if (context === undefined) {
    throw new Error('useSpotifyAuth must be used within a SpotifyAuthProvider');
  }
  return context;
}
