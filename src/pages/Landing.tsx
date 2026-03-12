import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Radio, Headphones, Globe, ArrowRight } from 'lucide-react';
import streamjetLogo from '@/assets/streamjet-logo.svg';

export default function Landing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/player', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={streamjetLogo} alt="StreamJet" className="h-10" />
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-brand text-white px-5 hover:opacity-90">
                Sign up free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-subtle">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] mb-6 animate-fade-in">
            Your world of
            <span className="text-gradient-brand block mt-1">radio, reimagined.</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in leading-relaxed" style={{ animationDelay: '100ms' }}>
            Discover stations from every corner of the globe. Pop, jazz, electronic, classical — whatever you're feeling, StreamJet has a station for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-white px-8 h-12 text-sm font-bold hover:opacity-90 shadow-brand tracking-wide uppercase">
                Start Listening
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
            Everything you need to
            <span className="text-gradient-brand"> explore music.</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto text-sm">
            StreamJet is built for music lovers who want more than just playlists.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
            {[
              {
                icon: Globe,
                title: 'Global Stations',
                description: 'Browse over 50,000 stations from 200+ countries, all in one place.',
              },
              {
                icon: Headphones,
                title: 'Genre Discovery',
                description: 'From ambient to rock, filter by genre and find your next favorite station.',
              },
              {
                icon: Radio,
                title: 'Live Radio',
                description: 'Stream high-quality live radio with a sleek, minimalist player.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="p-8 bg-background hover:bg-card transition-colors duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2 text-sm">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-14 bg-gradient-to-br from-primary/5 via-card to-card border border-border">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to tune in?</h2>
            <p className="text-muted-foreground mb-8 text-sm">
              Join thousands of listeners discovering new music every day.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-white px-8 h-12 text-sm font-bold hover:opacity-90 shadow-brand tracking-wide uppercase">
                Open Web Player
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <img src={streamjetLogo} alt="StreamJet" className="h-8 opacity-60" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} XZ1 Recording Ventures Inc.</p>
        </div>
      </footer>
    </div>
  );
}
