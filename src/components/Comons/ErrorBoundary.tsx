// src/components/common/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        // Mettre à jour l'état pour afficher l'UI de fallback
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Vous pouvez aussi enregistrer l'erreur dans un service de rapport d'erreurs
        console.error("Erreur capturée par ErrorBoundary:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            // Vous pouvez rendre n'importe quelle UI de fallback
            return this.props.fallback || (
                <div className="p-4 bg-red-100 text-red-700 rounded-md mx-auto max-w-lg my-4">
                    <h2 className="text-xl font-semibold mb-2">Une erreur est survenue</h2>
                    <p className="mb-4">Nous sommes désolés, une erreur inattendue s'est produite.</p>
                    <details className="text-sm">
                        <summary className="cursor-pointer">Détails techniques</summary>
                        <pre className="mt-2 p-2 bg-red-50 rounded text-xs overflow-auto">
              {this.state.error?.toString()}
            </pre>
                    </details>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => window.location.reload()}
                    >
                        Rafraîchir la page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;