import { useState, useRef } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Loader2, Upload, Copy, Check, ExternalLink, Share2, BadgeCheck } from 'lucide-react';
import { ProfileReactionStats } from './ProfileReactionStats';
import { CurrentlyListeningBadge } from './CurrentlyListeningBadge';
import { ShareableStatsCard } from './ShareableStatsCard';

export function ProfileView() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with profile data
  if (profile && !initialized) {
    setDisplayName(profile.display_name || '');
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setInitialized(true);
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      await refetch();

      toast({ title: 'Avatar updated!' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        display_name: displayName || null,
        username: username || null,
        bio: bio || null,
      });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') 
          ? 'This username is already taken' 
          : 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  const profileUrl = username 
    ? `${window.location.origin}/profile/@${username}`
    : null;

  const handleCopyLink = () => {
    if (!profileUrl) return;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Profile link copied!' });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Profile Settings</h2>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xl sm:text-2xl">
                  <User className="w-8 h-8 sm:w-10 sm:h-10" />
                </AvatarFallback>
              </Avatar>
              <button
                className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-foreground animate-spin" />
                ) : (
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="text-center sm:text-left flex-1">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                {profile?.display_name || user?.email}
                {profile?.is_verified && (
                  <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
                )}
              </CardTitle>
              <CardDescription className="text-sm">{user?.email}</CardDescription>
              {username && (
                <p className="text-sm text-primary mt-1">@{username}</p>
              )}
              {/* Currently listening badge */}
              <div className="mt-2">
                <CurrentlyListeningBadge />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="myhandle"
                  className="pl-8"
                />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Only lowercase letters, numbers, and underscores
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others about yourself..."
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full sm:w-auto">
            {updateProfile.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Reaction Stats Card */}
      <ProfileReactionStats />

      {/* Share Profile Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Share Your Profile</CardTitle>
          <CardDescription className="text-sm">
            {username 
              ? 'Share your profile with others so they can see your playlists and listening stats'
              : 'Set a username above to get a shareable profile link'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {profileUrl ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded-md text-xs sm:text-sm truncate">
                {profileUrl}
              </code>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={handleCopyLink} className="flex-1 sm:flex-none">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" size="icon" asChild className="flex-1 sm:flex-none">
                  <a href={profileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter a username above to generate your profile link
            </p>
          )}
        </CardContent>
      </Card>

      {/* Shareable Stats Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Your Music Identity
          </CardTitle>
          <CardDescription className="text-sm">
            Download or share your music identity as an image for social media
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <ShareableStatsCard />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Account</CardTitle>
          <CardDescription className="text-sm">Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Member since {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
