import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useActiveListeners } from '@/hooks/useActiveListeners';
import { LiveListenersBadge } from '@/components/dashboard/LiveListenersBadge';
import { AudioVisualizer } from '@/components/dashboard/AudioVisualizer';
import { ArrowLeft, Play, Pause, Heart, Share2, Users, Radio } from 'lucide-react';
import { useSavedStations, useSaveStation, useUnsaveStation } from '@/hooks/useSavedStations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function StationPage() {
  const { stationUuid } = useParams<{ stationUuid: string }>();
  const navigate = useNavigate();
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { data: savedStations } = useSavedStations();
  const saveStation = useSaveStation();
  const unsaveStation = useUnsaveStation();
  const { data: listeners } = useActiveListeners(stationUuid || '');

  const isCurrentStation = currentStation?.stationuuid === stationUuid;
  const isSaved = savedStations?.some(s => s.station_uuid === stationUuid);

  const handlePlayPause = () => {
    if (isCurrentStation) {
      if (isPlaying) pause();
      else resume();
    } else if (currentStation) {
      play(currentStation);
    }
  };

  const handleSave = async () => {
    if (!currentStation) return;
    try {
      if (isSaved) {
        await unsaveStation.mutateAsync(currentStation.stationuuid);
        toast.success('Removed from saved stations');
      } else {
        await saveStation.mutateAsync(currentStation);
        toast.success('Added to saved stations');
      }
    } catch {
      toast.error('Failed to update saved stations');
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!stationUuid) {
    return (
      <div className="flex items-center justify-center h-64 animate-fade-in">
        <p className="text-muted-foreground">Station not found</p>
      </div>
    );
  }

  const station = currentStation?.stationuuid === stationUuid ? currentStation : null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Card className="overflow-hidden animate-scale-in">
          <div className={cn(
            'relative h-48 sm:h-64 flex items-center justify-center',
            'bg-gradient-to-br from-primary/20 via-accent to-card'
          )}>
            {station?.favicon ? (
              <img src={station.favicon} alt={station.name} className="h-24 w-24 sm:h-32 sm:w-32 object-cover shadow-lg" />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 bg-gradient-brand flex items-center justify-center">
                <Radio className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
              </div>
            )}

            {isCurrentStation && isPlaying && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <AudioVisualizer />
              </div>
            )}
          </div>

          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{station?.name || 'Loading...'}</h1>
                {station && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {station.country && <span>{station.country}</span>}
                    {station.bitrate > 0 && <span>· {station.bitrate} kbps</span>}
                    {station.codec && <span>· {station.codec}</span>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
                <Button size="lg" className="gap-2" onClick={handlePlayPause}>
                  {isCurrentStation && isPlaying ? (
                    <><Pause className="h-5 w-5" /> Pause</>
                  ) : (
                    <><Play className="h-5 w-5" /> Play</>
                  )}
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleSave}>
                  <Heart className={cn('h-5 w-5', isSaved && 'fill-primary text-primary')} />
                </Button>
                <Button variant="outline" size="icon" className="h-11 w-11" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
              <LiveListenersBadge stationUuid={stationUuid} size="md" />
            </div>

            {station?.tags && (
              <div className="flex flex-wrap gap-2 animate-fade-in" style={{ animationDelay: '250ms' }}>
                {station.tags.split(',').slice(0, 6).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-muted text-xs text-muted-foreground">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {listeners && listeners.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {listeners.length} Listening Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listeners.slice(0, 6).map((listener, i) => (
                  <div key={listener.id} className="flex items-center gap-2 p-2 bg-muted/50">
                    <div className="h-8 w-8 bg-gradient-brand flex items-center justify-center text-xs text-primary-foreground font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm truncate">Listener</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
