import { Component, ErrorInfo, ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleRestart = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-icon-box">
            <ShieldAlert size={36} />
          </div>
          <h2 className="error-title">Something went wrong</h2>
          <p className="error-body">
            VaultKey encountered an unexpected error. Your vault data is completely safe.
          </p>
          <Button onClick={this.handleRestart}>
            Restart App
          </Button>
          {this.state.error && (
            <pre className="error-details">
              {this.state.error.name}: {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
