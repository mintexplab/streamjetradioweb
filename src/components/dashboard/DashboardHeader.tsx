import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useI18n } from '@/hooks/useI18n';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { User, LogOut, Globe } from 'lucide-react';
import streamjetLogo from '@/assets/streamjet-logo.svg';

interface DashboardHeaderProps {
  setView: (view: any) => void;
}

export function DashboardHeader({ setView }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const { data: profile } = useProfile();
  const { t, language, setLanguage, languages } = useI18n();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 md:hidden" />
          <img src={streamjetLogo} alt="StreamJet" className="h-8 w-auto object-contain md:hidden" />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-0.5 hover:bg-accent transition-colors outline-none">
              <Avatar className="w-8 h-8 border border-border">
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="bg-accent text-xs">
                  <User className="w-3.5 h-3.5" />
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">
                {profile?.display_name || profile?.username || user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView('profile')}>
              <User className="w-4 h-4 mr-2" />
              {t('profile')}
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Globe className="w-4 h-4 mr-2" />
                {t('language')}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {Object.entries(languages).map(([code, label]) => (
                  <DropdownMenuItem
                    key={code}
                    onClick={() => setLanguage(code as any)}
                    className={language === code ? 'bg-accent' : ''}
                  >
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              {t('logOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
