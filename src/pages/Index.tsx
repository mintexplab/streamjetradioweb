import { Radio } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-brand shadow-brand">
            <Radio className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-5xl font-bold text-gradient-brand">
          StreamJet Radio
        </h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Discover, stream, and share radio stations from around the world
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <div className="h-2 w-12 rounded-full bg-streamjet-red opacity-80"></div>
          <div className="h-2 w-12 rounded-full bg-streamjet-purple opacity-80"></div>
          <div className="h-2 w-12 rounded-full bg-streamjet-blue opacity-80"></div>
        </div>
      </div>
    </div>
  );
};

export default Index;
