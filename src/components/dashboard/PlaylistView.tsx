import { useState } from 'react';
import { usePlaylist, usePlaylistStations, useUpdatePlaylist, useDeletePlaylist, useRemoveStationFromPlaylist } from '@/hooks/usePlaylists';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Play, Pause, Trash2, Share2, Copy, Radio, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
}

export function PlaylistView({ playlistId, onBack }: PlaylistViewProps) {
  const { data: playlist, isLoading: loadingPlaylist } = usePlaylist(playlistId);
  const { data: stations, isLoading: loadingStations } = usePlaylistStations(playlistId);
  const updatePlaylist = useUpdatePlaylist();
  const deletePlaylist = useDeletePlaylist();
  const removeStation = useRemoveStationFromPlaylist();
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [copied, setCopied] = useState(false);

  if (loadingPlaylist) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Playlist not found</p>
        <Button variant="link" onClick={onBack}>
          Go back
        </Button>
      </div>
    );
  }

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    await updatePlaylist.mutateAsync({ id: playlistId, name: newName });
    setEditingName(false);
  };

  const handleTogglePublic = async () => {
    await updatePlaylist.mutateAsync({ id: playlistId, is_public: !playlist.is_public });
    toast({
      title: playlist.is_public ? 'Playlist is now private' : 'Playlist is now public',
    });
  };

  const handleDelete = async () => {
    await deletePlaylist.mutateAsync(playlistId);
    onBack();
    toast({ title: 'Playlist deleted' });
  };

  const handleRemoveStation = async (stationUuid: string) => {
    await removeStation.mutateAsync({ playlistId, stationUuid });
    toast({ title: 'Station removed from playlist' });
  };

  const handleCopyShareLink = () => {
    if (!playlist.share_code) return;
    const shareUrl = `${window.location.origin}/dashboard?share=${playlist.share_code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Share link copied!' });
  };

  const handlePlayStation = (station: typeof stations extends (infer T)[] ? T : never) => {
    if (!station) return;
    const stationData = {
      stationuuid: station.station_uuid,
      name: station.station_name,
      url: station.station_url,
      url_resolved: station.station_url,
      homepage: '',
      favicon: station.station_favicon || '',
      country: station.station_country || '',
      countrycode: '',
      state: '',
      language: '',
      languagecodes: '',
      votes: 0,
      codec: '',
      bitrate: 0,
      tags: station.station_tags || '',
      clickcount: 0,
      clicktrend: 0,
    };

    if (currentStation?.stationuuid === station.station_uuid) {
      if (isPlaying) {
        pause();
      } else {
        resume();
      }
    } else {
      play(stationData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        {editingName ? (
          <div className="flex gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name"
              className="w-64"
            />
            <Button onClick={handleUpdateName}>Save</Button>
            <Button variant="ghost" onClick={() => setEditingName(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <h2
            className="text-2xl font-bold cursor-pointer hover:text-primary"
            onClick={() => {
              setNewName(playlist.name);
              setEditingName(true);
            }}
          >
            {playlist.name}
          </h2>
        )}
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Switch
            id="public"
            checked={playlist.is_public}
            onCheckedChange={handleTogglePublic}
          />
          <Label htmlFor="public">Public playlist</Label>
        </div>

        {playlist.is_public && playlist.share_code && (
          <Button variant="outline" onClick={handleCopyShareLink}>
            {copied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            Copy Share Link
          </Button>
        )}

        <Button variant="destructive" onClick={handleDelete}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Playlist
        </Button>
      </div>

      <div className="space-y-2">
        {loadingStations ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))
        ) : stations?.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No stations in this playlist yet. Add some from the Discover page!
          </p>
        ) : (
          stations?.map((station, index) => {
            const isCurrentStation = currentStation?.stationuuid === station.station_uuid;
            return (
              <Card
                key={station.id}
                className={`transition-all hover:bg-muted/50 ${isCurrentStation ? 'ring-2 ring-primary' : ''}`}
              >
                <CardContent className="p-3 flex items-center gap-4">
                  <span className="text-muted-foreground w-6 text-right">{index + 1}</span>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handlePlayStation(station)}
                  >
                    {isCurrentStation && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>

                  {station.station_favicon ? (
                    <img
                      src={station.station_favicon}
                      alt=""
                      className="w-10 h-10 rounded-md object-cover bg-muted"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-md bg-gradient-brand flex items-center justify-center">
                      <Radio className="w-5 h-5 text-white" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{station.station_name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {station.station_country}
                    </p>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveStation(station.station_uuid)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
