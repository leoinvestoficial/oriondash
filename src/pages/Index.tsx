const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl orion-gradient flex items-center justify-center orion-glow">
          <span className="text-2xl text-primary-foreground font-bold">O</span>
        </div>
        <h1 className="text-display text-foreground mb-2">
          <span className="orion-text-gradient">Orion</span>
        </h1>
        <p className="text-muted-foreground mb-6">Marketing Intelligence Platform</p>
        <a
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg orion-gradient text-primary-foreground orion-glow hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Iniciar Onboarding →
        </a>
      </div>
    </div>
  );
};

export default Index;
