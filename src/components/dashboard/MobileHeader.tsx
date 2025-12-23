import { SidebarTrigger } from '@/components/ui/sidebar';
import { Radio } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between p-3 border-b border-border bg-card/95 backdrop-blur-lg sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-9 w-9" />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-brand">
            <Radio className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-gradient-brand">StreamJet</span>
        </div>
      </div>
      <ThemeToggle />
    </header>
  );
}
