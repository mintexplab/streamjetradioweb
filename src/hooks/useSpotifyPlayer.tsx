import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useSpotifyAuth } from './useSpotifyAuth';

interface SpotifyPlayerContextType {
  isReady: boolean;
  isPlaying: boolean;
  currentTrack: SpotifyTrack | null;
  position: number;
  duration: number;
  volume: number;
  deviceId: string | null;
  play: (uri: string) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  nextTrack: () => Promise<void>;
  previousTrack: () => Promise<void>;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

declare global {
  interface Window {
    Spotify: {
      Player: new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume: number;
      }) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

interface SpotifyPlayerInstance {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  addListener: (event: string, callback: (data: unknown) => void) => void;
  removeListener: (event: string, callback?: (data: unknown) => void) => void;
  getCurrentState: () => Promise<WebPlaybackState | null>;
  setName: (name: string) => Promise<void>;
  getVolume: () => Promise<number>;
  setVolume: (volume: number) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  togglePlay: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
}

interface WebPlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
  };
}

const SpotifyPlayerContext = createContext<SpotifyPlayerContextType | undefined>(undefined);

export function SpotifyPlayerProvider({ children }: { children: ReactNode }) {
  const { accessToken, isPremium, refreshToken } = useSpotifyAuth();
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.5);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const playerRef = useRef<SpotifyPlayerInstance | null>(null);
  const sdkLoadedRef = useRef(false);

  // Load Spotify Web Playback SDK
  useEffect(() => {
    if (!isPremium || !accessToken || sdkLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;

    window.onSpotifyWebPlaybackSDKReady = () => {
      sdkLoadedRef.current = true;
      initializePlayer();
    };

    document.body.appendChild(script);

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [isPremium, accessToken]);

  const initializePlayer = useCallback(() => {
    if (!window.Spotify || !accessToken) return;

    const player = new window.Spotify.Player({
      name: 'StreamJet Radio',
      getOAuthToken: async (cb) => {
        // Try to get fresh token
        const token = await refreshToken();
        cb(token || accessToken);
      },
      volume: volume,
    });

    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Player Ready with Device ID:', device_id);
      setDeviceId(device_id);
      setIsReady(true);
    });

    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device ID has gone offline:', device_id);
      setIsReady(false);
    });

    player.addListener('player_state_changed', (state: WebPlaybackState | null) => {
      if (!state) {
        setIsPlaying(false);
        setCurrentTrack(null);
        return;
      }

      setIsPlaying(!state.paused);
      setPosition(state.position);
      setDuration(state.duration);
      setCurrentTrack(state.track_window.current_track);
    });

    player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Spotify Player Init Error:', message);
    });

    player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Spotify Player Auth Error:', message);
    });

    player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Spotify Player Account Error:', message);
    });

    player.connect();
    playerRef.current = player;
  }, [accessToken, volume, refreshToken]);

  // Re-initialize when token changes
  useEffect(() => {
    if (sdkLoadedRef.current && accessToken && isPremium && !playerRef.current) {
      initializePlayer();
    }
  }, [accessToken, isPremium, initializePlayer]);

  // Position update interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(async () => {
      if (playerRef.current) {
        const state = await playerRef.current.getCurrentState();
        if (state) {
          setPosition(state.position);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const play = async (uri: string) => {
    if (!deviceId || !accessToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [uri],
        }),
      });
    } catch (err) {
      console.error('Failed to play track:', err);
    }
  };

  const pause = async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    }
  };

  const resume = async () => {
    if (playerRef.current) {
      await playerRef.current.resume();
    }
  };

  const seek = async (positionMs: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(positionMs);
    }
  };

  const setVolume = async (newVolume: number) => {
    setVolumeState(newVolume);
    if (playerRef.current) {
      await playerRef.current.setVolume(newVolume);
    }
  };

  const nextTrack = async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    }
  };

  const previousTrack = async () => {
    if (playerRef.current) {
      await playerRef.current.previousTrack();
    }
  };

  return (
    <SpotifyPlayerContext.Provider
      value={{
        isReady,
        isPlaying,
        currentTrack,
        position,
        duration,
        volume,
        deviceId,
        play,
        pause,
        resume,
        seek,
        setVolume,
        nextTrack,
        previousTrack,
      }}
    >
      {children}
    </SpotifyPlayerContext.Provider>
  );
}

export function useSpotifyPlayer() {
  const context = useContext(SpotifyPlayerContext);
  if (context === undefined) {
    throw new Error('useSpotifyPlayer must be used within a SpotifyPlayerProvider');
  }
  return context;
}
