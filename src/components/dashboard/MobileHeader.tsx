import { SidebarTrigger } from '@/components/ui/sidebar';
import { Radio } from 'lucide-react';

export function MobileHeader() {
  return (
    <header className="flex md:hidden items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8" />
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-primary">
            <Radio className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm">StreamJet</span>
        </div>
      </div>
    </header>
  );
}
