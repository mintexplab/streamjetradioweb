import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Percent, Music, Radio } from 'lucide-react';
import { useTasteCompatibility } from '@/hooks/useTasteCompatibility';
import { useMusicIdentityCompatibility, useFavoriteArtists } from '@/hooks/useMusicIdentity';
import { Link } from 'react-router-dom';

interface TasteCompatibilityDisplayProps {
  userId: string;
  showDetails?: boolean;
}

export function TasteCompatibilityDisplay({ userId, showDetails = false }: TasteCompatibilityDisplayProps) {
  const { compatibilityScore: stationScore, sharedStations, insights: stationInsights } = useTasteCompatibility(userId);
  const { score: musicScore, sharedArtists, sharedTracks } = useMusicIdentityCompatibility(userId);
  
  // Combined score
  const hasStationData = stationScore > 0 || sharedStations.length > 0;
  const hasMusicData = musicScore > 0 || sharedArtists.length > 0;
  
  let combinedScore = 0;
  if (hasStationData && hasMusicData) {
    combinedScore = Math.round((stationScore * 0.5) + (musicScore * 0.5));
  } else if (hasStationData) {
    combinedScore = stationScore;
  } else if (hasMusicData) {
    combinedScore = musicScore;
  }

  const allInsights = [
    ...stationInsights,
    ...(sharedArtists.length > 0 ? [`${sharedArtists.length} shared artist${sharedArtists.length > 1 ? 's' : ''}`] : []),
    ...(sharedTracks.length > 0 ? [`${sharedTracks.length} shared track${sharedTracks.length > 1 ? 's' : ''}`] : []),
  ];

  if (combinedScore === 0 && !showDetails) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-primary';
    if (score >= 40) return 'text-yellow-500';
    return 'text-muted-foreground';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Soulmates';
    if (score >= 60) return 'Great Match';
    if (score >= 40) return 'Good Vibes';
    if (score >= 20) return 'Some Overlap';
    return 'Discovering';
  };

  if (!showDetails) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Heart className={`w-3 h-3 ${getScoreColor(combinedScore)}`} />
        {combinedScore}% match
      </Badge>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className={`w-5 h-5 ${getScoreColor(combinedScore)}`} />
          Taste Compatibility
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score display */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(combinedScore / 100) * 226} 226`}
                className={getScoreColor(combinedScore)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-xl font-bold ${getScoreColor(combinedScore)}`}>{combinedScore}%</span>
            </div>
          </div>
          <div>
            <p className={`font-semibold ${getScoreColor(combinedScore)}`}>{getScoreLabel(combinedScore)}</p>
            <p className="text-sm text-muted-foreground">
              {allInsights[0] || 'Keep listening to discover more'}
            </p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Stations</span>
            </div>
            <p className="text-2xl font-bold">{stationScore}%</p>
            {sharedStations.length > 0 && (
              <p className="text-xs text-muted-foreground">{sharedStations.length} in common</p>
            )}
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Music className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Music Taste</span>
            </div>
            <p className="text-2xl font-bold">{musicScore}%</p>
            {sharedArtists.length > 0 && (
              <p className="text-xs text-muted-foreground">{sharedArtists.length} shared artists</p>
            )}
          </div>
        </div>

        {/* Shared artists */}
        {sharedArtists.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Shared Artists</p>
            <div className="flex -space-x-2">
              {sharedArtists.slice(0, 6).map((artist) => (
                <Link key={artist.id} to={`/artist/${artist.artist_id}`}>
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={artist.artist_image || undefined} />
                    <AvatarFallback className="text-xs">{artist.artist_name[0]}</AvatarFallback>
                  </Avatar>
                </Link>
              ))}
              {sharedArtists.length > 6 && (
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                  +{sharedArtists.length - 6}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Shared stations */}
        {sharedStations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Shared Stations</p>
            <div className="flex flex-wrap gap-1">
              {sharedStations.slice(0, 5).map((station) => (
                <Badge key={station} variant="outline" className="text-xs">
                  {station}
                </Badge>
              ))}
              {sharedStations.length > 5 && (
                <Badge variant="outline" className="text-xs">+{sharedStations.length - 5}</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
