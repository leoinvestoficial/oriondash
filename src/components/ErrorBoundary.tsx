import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("ErrorBoundary caught an error:", error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 text-center gap-6">
          <div className="rounded-3xl border border-input bg-card p-10 shadow-lg shadow-black/5 max-w-xl">
            <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Erro inesperado</p>
            <h1 className="mt-4 text-3xl font-semibold">Ops! Algo deu errado.</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              O aplicativo encontrou um problema ao carregar a página. Isso pode ser temporário.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={this.handleReload}>Recarregar</Button>
              <Button variant="outline" onClick={() => window.location.assign("/")}>Início</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
