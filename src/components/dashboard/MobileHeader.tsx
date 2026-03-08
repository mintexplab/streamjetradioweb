import { SidebarTrigger } from '@/components/ui/sidebar';
import streamjetLogo from '@/assets/streamjet-logo.png';

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8" />
        <img src={streamjetLogo} alt="StreamJet" className="h-5 w-auto object-contain" />
      </div>
    </header>
  );
}
