import React, { useState } from 'react';
import { Music, Mic, Guitar, Search, X, Plus, Disc } from 'lucide-react';
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
import { useSearchArtists, useArtistDiscography, AudioDBArtist, AudioDBAlbum } from '@/hooks/useAudioDB';
import { Link } from 'react-router-dom';

const INSTRUMENTS = [
  'Guitar', 'Bass', 'Drums', 'Piano', 'Keyboard', 'Violin', 'Cello', 
  'Saxophone', 'Trumpet', 'Flute', 'Synthesizer', 'Turntables', 'Voice'
];

const ROLES = [
  'Producer', 'Vocalist', 'DJ', 'Composer', 'Engineer', 'Songwriter', 
  'Beatmaker', 'Arranger', 'Mixer', 'Mastering Engineer'
];

function ArtistSearchDialog({ onSelect }: { onSelect: (artist: AudioDBArtist) => void }) {
  const [search, setSearch] = useState('');
  const { data: artists, isLoading } = useSearchArtists(search);
  const [open, setOpen] = useState(false);

  const handleSelect = (artist: AudioDBArtist) => {
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
          <DialogTitle>Search Artists</DialogTitle>
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
                    key={artist.idArtist}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => handleSelect(artist)}
                  >
                    <Avatar>
                      <AvatarImage src={artist.strArtistThumb || undefined} />
                      <AvatarFallback>{artist.strArtist[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{artist.strArtist}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {artist.strGenre || artist.strStyle || 'Unknown genre'}
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
  const [selectedArtist, setSelectedArtist] = useState<AudioDBArtist | null>(null);
  const { data: artists, isLoading: loadingArtists } = useSearchArtists(search);
  const { data: discography, isLoading: loadingDiscography } = useArtistDiscography(selectedArtist?.idArtist || '');
  const [open, setOpen] = useState(false);

  const handleSelectArtist = (artist: AudioDBArtist) => {
    setSelectedArtist(artist);
  };

  const handleSelectAlbum = (album: AudioDBAlbum) => {
    // Use album as track since free API doesn't have track search
    onSelect({
      track_id: album.idAlbum,
      track_name: album.strAlbum,
      artist_name: album.strArtist,
      album_name: album.strAlbum,
      track_image: album.strAlbumThumb || undefined,
    });
    setOpen(false);
    setSearch('');
    setSelectedArtist(null);
  };

  const handleBack = () => {
    setSelectedArtist(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSelectedArtist(null); setSearch(''); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Track/Album
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedArtist ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleBack}>←</Button>
                {selectedArtist.strArtist}'s Albums
              </div>
            ) : (
              'Search by Artist'
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {!selectedArtist ? (
            <>
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
                {loadingArtists ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : artists && artists.length > 0 ? (
                  <div className="space-y-2">
                    {artists.map((artist) => (
                      <div
                        key={artist.idArtist}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => handleSelectArtist(artist)}
                      >
                        <Avatar>
                          <AvatarImage src={artist.strArtistThumb || undefined} />
                          <AvatarFallback>{artist.strArtist[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{artist.strArtist}</p>
                          <p className="text-sm text-muted-foreground">Click to see albums</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : search.length >= 2 ? (
                  <p className="text-center text-muted-foreground py-8">No artists found</p>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Type at least 2 characters to search</p>
                )}
              </ScrollArea>
            </>
          ) : (
            <ScrollArea className="h-[350px]">
              {loadingDiscography ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : discography && discography.length > 0 ? (
                <div className="space-y-2">
                  {discography.map((album) => (
                    <div
                      key={album.idAlbum}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectAlbum(album)}
                    >
                      {album.strAlbumThumb ? (
                        <img src={album.strAlbumThumb} alt="" className="w-12 h-12 rounded object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Disc className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{album.strAlbum}</p>
                        <p className="text-sm text-muted-foreground">{album.intYearReleased || 'Unknown year'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No albums found</p>
              )}
            </ScrollArea>
          )}
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

  const addArtist = useAddFavoriteArtist();
  const removeArtist = useRemoveFavoriteArtist();
  const addTrack = useAddFavoriteTrack();
  const removeTrack = useRemoveFavoriteTrack();
  const addRole = useAddMusicRole();
  const removeRole = useRemoveMusicRole();

  const handleAddArtist = async (artist: AudioDBArtist) => {
    try {
      await addArtist.mutateAsync({
        artist_id: artist.idArtist,
        artist_name: artist.strArtist,
        artist_image: artist.strArtistThumb || undefined,
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
      toast({ title: 'Album added to favorites' });
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

  const instruments = musicRoles?.filter(r => r.role_type === 'instrument') || [];
  const roles = musicRoles?.filter(r => r.role_type === 'role') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Music className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Music Identity</h2>
      </div>

      <Tabs defaultValue="artists">
        <TabsList>
          <TabsTrigger value="artists">Favorite Artists</TabsTrigger>
          <TabsTrigger value="tracks">Favorite Albums</TabsTrigger>
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
              Add your favorite albums/tracks
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
                <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                  <span className="w-5 text-muted-foreground text-sm font-medium">{index + 1}</span>
                  {track.track_image ? (
                    <img src={track.track_image} alt="" className="w-12 h-12 rounded object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                      <Disc className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{track.track_name}</p>
                    <p className="text-sm text-muted-foreground truncate">{track.artist_name}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                    onClick={() => handleRemoveTrack(track.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Disc className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No favorite albums yet</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Guitar className="h-4 w-4" />
                <h3 className="font-medium">Instruments</h3>
              </div>
              <AddRoleDialog type="instrument" onAdd={(name) => handleAddRole('instrument', name)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {instruments.map((inst) => (
                <Badge key={inst.id} variant="secondary" className="gap-1">
                  {inst.role_name}
                  <button onClick={() => handleRemoveRole(inst.id)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {instruments.length === 0 && (
                <p className="text-sm text-muted-foreground">No instruments added</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                <h3 className="font-medium">Music Roles</h3>
              </div>
              <AddRoleDialog type="role" onAdd={(name) => handleAddRole('role', name)} />
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <Badge key={role.id} variant="secondary" className="gap-1">
                  {role.role_name}
                  <button onClick={() => handleRemoveRole(role.id)}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-muted-foreground">No roles added</p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
