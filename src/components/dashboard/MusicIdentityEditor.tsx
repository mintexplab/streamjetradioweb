import React, { useState } from 'react';
import { Music, Search, X, Plus, Disc, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  useFavoriteArtists, 
  useFavoriteTracks, 
  useUserMusicRoles,
  useAddFavoriteArtist,
  useRemoveFavoriteArtist,
  useAddFavoriteTrack,
  useRemoveFavoriteTrack,
  useAddMusicRole,
  useRemoveMusicRole,
} from '@/hooks/useMusicIdentity';
import { useSearchSpotifyArtists, useSearchSpotifyTracks, SpotifyArtist, SpotifyTrack } from '@/hooks/useSpotifySearch';
import { useSpotifyAuth } from '@/hooks/useSpotifyAuth';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';
import { Link } from 'react-router-dom';

const INSTRUMENTS = [
  'Guitar', 'Bass', 'Drums', 'Piano', 'Keyboard', 'Violin', 'Cello', 
  'Saxophone', 'Trumpet', 'Flute', 'Synthesizer', 'Turntables', 'Voice'
];

const ROLES = [
  'Producer', 'Vocalist', 'DJ', 'Composer', 'Engineer', 'Songwriter', 
  'Beatmaker', 'Arranger', 'Mixer', 'Mastering Engineer'
];

function ArtistSearchDialog({ onSelect }: { onSelect: (artist: SpotifyArtist) => void }) {
  const [search, setSearch] = useState('');
  const { data: artists, isLoading } = useSearchSpotifyArtists(search);
  const [open, setOpen] = useState(false);

  const handleSelect = (artist: SpotifyArtist) => {
    onSelect(artist);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Artist
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Artists on Spotify</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for an artist..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[300px]">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : artists && artists.length > 0 ? (
              <div className="space-y-2">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSelect(artist)}
                  >
                    <Avatar>
                      <AvatarImage src={artist.images?.[0]?.url} />
                      <AvatarFallback>{artist.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{artist.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {artist.genres?.slice(0, 2).join(', ') || 'Artist'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <p className="text-center text-muted-foreground py-8">
                No artists found
              </p>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Type at least 2 characters to search
              </p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TrackSearchDialog({ onSelect }: { onSelect: (track: { track_id: string; track_name: string; artist_name: string; album_name?: string; track_image?: string }) => void }) {
  const [search, setSearch] = useState('');
  const { data: tracks, isLoading } = useSearchSpotifyTracks(search);
  const [open, setOpen] = useState(false);
  const { isPremium } = useSpotifyAuth();
  const { play } = useSpotifyPlayer();

  const handleSelectTrack = (track: SpotifyTrack) => {
    onSelect({
      track_id: track.id,
      track_name: track.name,
      artist_name: track.artists.map(a => a.name).join(', '),
      album_name: track.album.name,
      track_image: track.album.images?.[0]?.url,
    });
    setOpen(false);
    setSearch('');
  };

  const handlePlay = (e: React.MouseEvent, track: SpotifyTrack) => {
    e.stopPropagation();
    if (isPremium) {
      play(track.uri);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Track
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Search Tracks on Spotify</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for a track..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <ScrollArea className="h-[350px]">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : tracks && tracks.length > 0 ? (
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer group"
                    onClick={() => handleSelectTrack(track)}
                  >
                    <div className="relative">
                      {track.album.images?.[0]?.url ? (
                        <img src={track.album.images[0].url} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Disc className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      {isPremium && (
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute inset-0 w-12 h-12 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handlePlay(e, track)}
                        >
                          <Play className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{track.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {track.artists.map(a => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : search.length >= 2 ? (
              <p className="text-center text-muted-foreground py-8">No tracks found</p>
            ) : (
              <p className="text-center text-muted-foreground py-8">Type at least 2 characters to search</p>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddRoleDialog({ type, onAdd }: { type: 'instrument' | 'role'; onAdd: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const options = type === 'instrument' ? INSTRUMENTS : ROLES;

  const handleAdd = () => {
    if (value) {
      onAdd(value);
      setOpen(false);
      setValue('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add {type === 'instrument' ? 'Instrument' : 'Role'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add {type === 'instrument' ? 'Instrument' : 'Role'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={value} onValueChange={setValue}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${type === 'instrument' ? 'an instrument' : 'a role'}...`} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!value} className="w-full">
            Add
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MusicIdentityEditor() {
  const { toast } = useToast();
  const { data: favoriteArtists, isLoading: loadingArtists } = useFavoriteArtists();
  const { data: favoriteTracks, isLoading: loadingTracks } = useFavoriteTracks();
  const { data: musicRoles, isLoading: loadingRoles } = useUserMusicRoles();
  const { isConnected, isPremium } = useSpotifyAuth();
  const { play } = useSpotifyPlayer();

  const addArtist = useAddFavoriteArtist();
  const removeArtist = useRemoveFavoriteArtist();
  const addTrack = useAddFavoriteTrack();
  const removeTrack = useRemoveFavoriteTrack();
  const addRole = useAddMusicRole();
  const removeRole = useRemoveMusicRole();

  const handleAddArtist = async (artist: SpotifyArtist) => {
    try {
      await addArtist.mutateAsync({
        artist_id: artist.id,
        artist_name: artist.name,
        artist_image: artist.images?.[0]?.url,
      });
      toast({ title: 'Artist added to favorites' });
    } catch {
      toast({ title: 'Failed to add artist', variant: 'destructive' });
    }
  };

  const handleRemoveArtist = async (id: string) => {
    try {
      await removeArtist.mutateAsync(id);
      toast({ title: 'Artist removed from favorites' });
    } catch {
      toast({ title: 'Failed to remove artist', variant: 'destructive' });
    }
  };

  const handleAddTrack = async (track: { track_id: string; track_name: string; artist_name: string; album_name?: string; track_image?: string }) => {
    try {
      await addTrack.mutateAsync(track);
      toast({ title: 'Track added to favorites' });
    } catch {
      toast({ title: 'Failed to add', variant: 'destructive' });
    }
  };

  const handleRemoveTrack = async (id: string) => {
    try {
      await removeTrack.mutateAsync(id);
      toast({ title: 'Removed from favorites' });
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  const handleAddRole = async (roleType: 'instrument' | 'role', roleName: string) => {
    try {
      await addRole.mutateAsync({ roleType, roleName });
      toast({ title: `${roleType === 'instrument' ? 'Instrument' : 'Role'} added` });
    } catch {
      toast({ title: 'Failed to add', variant: 'destructive' });
    }
  };

  const handleRemoveRole = async (id: string) => {
    try {
      await removeRole.mutateAsync(id);
    } catch {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  const handlePlayTrack = (trackId: string) => {
    if (isPremium) {
      play(`spotify:track:${trackId}`);
    }
  };

  const instruments = musicRoles?.filter(r => r.role_type === 'instrument') || [];
  const roles = musicRoles?.filter(r => r.role_type === 'role') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Music className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Music Identity</h2>
        <Badge variant="secondary" className="ml-2">
          Powered by Spotify
        </Badge>
      </div>

      <Tabs defaultValue="artists">
        <TabsList>
          <TabsTrigger value="artists">Favorite Artists</TabsTrigger>
          <TabsTrigger value="tracks">Favorite Tracks</TabsTrigger>
          <TabsTrigger value="roles">Instruments & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="artists" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground text-sm">
              Add your favorite artists to build your music identity
            </p>
            <ArtistSearchDialog onSelect={handleAddArtist} />
          </div>

          {loadingArtists ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : favoriteArtists && favoriteArtists.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {favoriteArtists.map((artist, index) => (
                <Card key={artist.id} className="relative group">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 z-10"
                    onClick={() => handleRemoveArtist(artist.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  <Link to={`/artist/${artist.artist_id}`}>
                    <CardContent className="p-3 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-2">
                        <AvatarImage src={artist.artist_image || undefined} />
                        <AvatarFallback>{artist.artist_name[0]}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium text-sm truncate">{artist.artist_name}</p>
                      <p className="text-xs text-muted-foreground">#{index + 1}</p>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No favorite artists yet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tracks" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-muted-foreground text-sm">
              Add your favorite tracks
              {isPremium && <span className="text-primary ml-1">(Click to play with Premium)</span>}
            </p>
            <TrackSearchDialog onSelect={handleAddTrack} />
          </div>

          {loadingTracks ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : favoriteTracks && favoriteTracks.length > 0 ? (
            <div className="space-y-2">
              {favoriteTracks.map((track, index) => (
                <div 
                  key={track.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group cursor-pointer hover:bg-muted"
                  onClick={() => handlePlayTrack(track.track_id)}
                >
                  <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                  <div className="relative">
                    {track.track_image ? (
                      <img src={track.track_image} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Music className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    {isPremium && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.track_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={(e) => { e.stopPropagation(); handleRemoveTrack(track.id); }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Music className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No favorite tracks yet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Instruments I Play</h3>
              <AddRoleDialog type="instrument" onAdd={(name) => handleAddRole('instrument', name)} />
            </div>
            {loadingRoles ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20" />
                ))}
              </div>
            ) : instruments.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {instruments.map((role) => (
                  <Badge key={role.id} variant="secondary" className="gap-1 pr-1">
                    {role.role_name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => handleRemoveRole(role.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No instruments added</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Music Roles</h3>
              <AddRoleDialog type="role" onAdd={(name) => handleAddRole('role', name)} />
            </div>
            {loadingRoles ? (
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20" />
                ))}
              </div>
            ) : roles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role.id} variant="outline" className="gap-1 pr-1">
                    {role.role_name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 hover:bg-transparent"
                      onClick={() => handleRemoveRole(role.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No roles added</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
