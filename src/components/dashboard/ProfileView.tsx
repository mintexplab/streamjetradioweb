import { useState, useRef } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Save, Loader2, Upload, BadgeCheck } from 'lucide-react';
import { CurrentlyListeningBadge } from './CurrentlyListeningBadge';

export function ProfileView() {
  const { user } = useAuth();
  const { data: profile, isLoading, refetch } = useProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const { t } = useI18n();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (profile && !initialized) {
    setDisplayName(profile.display_name || '');
    setUsername(profile.username || '');
    setBio(profile.bio || '');
    setInitialized(true);
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await updateProfile.mutateAsync({ avatar_url: publicUrl });
      await refetch();
      toast({ title: 'Avatar updated!' });
    } catch (error: any) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ display_name: displayName || null, username: username || null, bio: bio || null });
      toast({ title: 'Profile updated' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message?.includes('duplicate') ? 'Username taken' : 'Failed to update',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 sm:space-y-6 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold">{t('profileSettings')}</h2>

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
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center sm:text-left flex-1">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                {profile?.display_name || user?.email}
                {profile?.is_verified && <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />}
              </CardTitle>
              <CardDescription className="text-sm">{user?.email}</CardDescription>
              {username && <p className="text-sm text-primary mt-1">@{username}</p>}
              <div className="mt-2"><CurrentlyListeningBadge /></div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your display name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="myhandle" className="pl-8" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." rows={3} />
          </div>
          <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full sm:w-auto">
            {updateProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {t('save')}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">{t('account')}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            {t('memberSince')} {profile ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
