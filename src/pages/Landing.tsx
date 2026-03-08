import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Radio, Headphones, Users, Zap, Globe, ArrowRight } from 'lucide-react';
import streamjetLogo from '@/assets/streamjet-logo.png';

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
          <img src={streamjetLogo} alt="StreamJet" className="h-8" />
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-brand text-white rounded-full px-5 hover:opacity-90">
                Sign up free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            50,000+ radio stations worldwide
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in">
            Your world of
            <span className="text-gradient-brand block">radio, reimagined.</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
            Discover stations from every corner of the globe. Pop, jazz, electronic, classical — whatever you're feeling, StreamJet has a station for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-white rounded-full px-8 h-12 text-base font-semibold hover:opacity-90 shadow-brand">
                Start Listening Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
            Everything you need to
            <span className="text-gradient-brand"> explore music.</span>
          </h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            StreamJet is built for music lovers who want more than just playlists.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
              {
                icon: Users,
                title: 'Social Listening',
                description: 'See what friends are tuned into and discover stations together.',
              },
              {
                icon: Zap,
                title: 'Reactions & Energy',
                description: 'React to what\'s playing and see real-time energy levels on stations.',
              },
              {
                icon: ArrowRight,
                title: 'Music Identity',
                description: 'Build your listening profile and share your unique taste with the world.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="group p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-brand animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/50">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to tune in?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of listeners discovering new music every day.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-brand text-white rounded-full px-8 h-12 text-base font-semibold hover:opacity-90 shadow-brand">
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
          <img src={streamjetLogo} alt="StreamJet" className="h-6 opacity-60" />
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} StreamJet. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
