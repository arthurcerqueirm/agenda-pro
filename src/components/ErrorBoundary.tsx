import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 bg-surface-light">
                    <div className="ios-card max-w-sm w-full text-center space-y-6 animate-in fade-in zoom-in-95">
                        <div className="w-20 h-20 bg-danger/10 text-danger rounded-[2rem] flex items-center justify-center mx-auto">
                            <AlertCircle size={40} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-dark">Algo deu errado</h2>
                            <p className="text-dark/40 text-sm mt-2">
                                Ocorreu um erro inesperado ao carregar este módulo.
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full h-14 bg-primary text-white rounded-2xl font-bold flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                        >
                            <RotateCcw size={20} />
                            <span>Recarregar Página</span>
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
