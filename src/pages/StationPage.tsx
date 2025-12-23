import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useRadioPlayer } from '@/hooks/useRadioPlayer';
import { useActiveListeners } from '@/hooks/useActiveListeners';
import { useStationReactions, calculateEnergy, REACTION_EMOJIS } from '@/hooks/useReactions';
import { EnergyMeter } from '@/components/dashboard/EnergyMeter';
import { ReactionBar } from '@/components/dashboard/ReactionBar';
import { VibePulse } from '@/components/dashboard/VibePulse';
import { LiveListenersBadge } from '@/components/dashboard/LiveListenersBadge';
import { AudioVisualizer } from '@/components/dashboard/AudioVisualizer';
import { ArrowLeft, Play, Pause, Heart, Share2, Users, Radio } from 'lucide-react';
import { useSavedStations, useSaveStation, useUnsaveStation } from '@/hooks/useSavedStations';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// We need to fetch station data - this is a simplified version
// In production, you'd want a proper hook to fetch station by UUID

export function StationPage() {
  const { stationUuid } = useParams<{ stationUuid: string }>();
  const navigate = useNavigate();
  const { currentStation, isPlaying, play, pause, resume } = useRadioPlayer();
  const { data: savedStations } = useSavedStations();
  const saveStation = useSaveStation();
  const unsaveStation = useUnsaveStation();
  const { data: listeners } = useActiveListeners(stationUuid || '');
  const { data: reactions, counts } = useStationReactions(stationUuid || '');
  
  const energy = calculateEnergy(reactions || []);
  const isCurrentStation = currentStation?.stationuuid === stationUuid;
  const isSaved = savedStations?.some(s => s.station_uuid === stationUuid);

  const handlePlayPause = () => {
    if (isCurrentStation) {
      if (isPlaying) pause();
      else resume();
    } else if (currentStation) {
      // Play the station we have in context
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
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  if (!stationUuid) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Station not found</p>
      </div>
    );
  }

  // If we're on this page but the station isn't loaded, show what we have
  const station = currentStation?.stationuuid === stationUuid ? currentStation : null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Main station card */}
        <Card className="overflow-hidden">
          <div className={cn(
            'relative h-48 sm:h-64 flex items-center justify-center',
            'bg-gradient-to-br from-streamjet-purple/20 via-streamjet-red/20 to-streamjet-blue/20'
          )}>
            {station?.favicon ? (
              <img
                src={station.favicon}
                alt={station.name}
                className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl object-cover shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl bg-gradient-brand flex items-center justify-center">
                <Radio className="h-12 w-12 sm:h-16 sm:w-16 text-primary-foreground" />
              </div>
            )}

            {/* Visualizer overlay */}
            {isCurrentStation && isPlaying && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <AudioVisualizer />
              </div>
            )}
          </div>

          <CardContent className="p-4 sm:p-6 space-y-4">
            {/* Station info */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {station?.name || 'Loading station...'}
                </h1>
                {station && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {station.country && <span>{station.country}</span>}
                    {station.bitrate > 0 && <span>• {station.bitrate} kbps</span>}
                    {station.codec && <span>• {station.codec}</span>}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handlePlayPause}
                >
                  {isCurrentStation && isPlaying ? (
                    <><Pause className="h-5 w-5" /> Pause</>
                  ) : (
                    <><Play className="h-5 w-5" /> Play</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={handleSave}
                >
                  <Heart className={cn('h-5 w-5', isSaved && 'fill-streamjet-red text-streamjet-red')} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={handleShare}
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Live stats */}
            <div className="flex flex-wrap items-center gap-4">
              <LiveListenersBadge stationUuid={stationUuid} size="md" />
              <EnergyMeter stationUuid={stationUuid} size="lg" showCounts />
            </div>

            {/* Vibe pulse */}
            <VibePulse stationUuid={stationUuid} />

            {/* Reactions */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium mb-3">How's this station?</h3>
              <ReactionBar
                stationUuid={stationUuid}
                stationName={station?.name || 'Unknown'}
              />
            </div>

            {/* Tags */}
            {station?.tags && (
              <div className="flex flex-wrap gap-2">
                {station.tags.split(',').slice(0, 6).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded-full bg-muted text-xs text-muted-foreground"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listeners section */}
        {listeners && listeners.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-primary" />
                {listeners.length} Listening Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listeners.slice(0, 6).map((listener, i) => (
                  <div
                    key={listener.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-brand flex items-center justify-center text-xs text-primary-foreground font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm truncate">Listener</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent reactions */}
        {reactions && reactions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recent Vibes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {reactions.slice(0, 20).map(reaction => (
                  <span
                    key={reaction.id}
                    className="text-lg animate-fade-in"
                    style={{
                      animationDelay: `${Math.random() * 0.5}s`
                    }}
                  >
                    {REACTION_EMOJIS[reaction.reaction_type].emoji}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
