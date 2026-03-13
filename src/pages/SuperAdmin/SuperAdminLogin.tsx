import React, { useState } from 'react'
import { ShieldAlert, Loader2, Lock } from 'lucide-react'
import { Button } from '../../components/Button'
import { cn } from '../../utils/cn'

interface SuperAdminLoginProps {
    onLogin: () => void
}

export const SuperAdminLogin: React.FC<SuperAdminLoginProps> = ({ onLogin }) => {
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    // Simulando uma senha mestra (pode ser o que o cliente definir)
    const MASTER_PASSWORD = 'admin'

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        setTimeout(() => {
            if (password === MASTER_PASSWORD) {
                // Autenticação bem sucedida, ele vai liberar o componente pai
                // Isso é só frontend gatekeeping temporário considerando que o AdminClient já está na .env
                onLogin()
            } else {
                setError('Senha incorreta. Acesso negado.')
            }
            setLoading(false)
        }, 800)
    }

    return (
        <div className="min-h-screen bg-danger-light/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center fade-in">
                <div className="w-20 h-20 bg-danger-dark/10 rounded-full flex items-center justify-center mx-auto text-danger-dark shadow-inner mb-6">
                    <ShieldAlert size={40} />
                </div>
                <h2 className="text-3xl font-display font-bold text-dark tracking-tight">Super Admin</h2>
                <p className="mt-2 text-sm font-medium text-dark/40 uppercase tracking-widest">Acesso Restrito ao Backoffice</p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md fade-in" style={{ animationDelay: '100ms' }}>
                <div className="bg-white py-10 px-6 sm:px-10 rounded-ios-lg shadow-ios border border-surface-neutral/50">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-danger/10 text-danger-dark p-4 rounded-xl text-center font-bold text-sm animate-in zoom-in-95">
                                {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] font-bold text-dark/40 uppercase tracking-widest ml-1 mb-2">
                                Senha Mestra
                            </label>
                            <div className="mt-1 relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                                <input
                                    type="password"
                                    required
                                    className="ios-input w-full pl-12 h-14 bg-surface-light/50 border-transparent focus:bg-white focus:border-danger/30"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Button
                                type="submit"
                                className="w-full h-14 bg-danger-dark hover:bg-danger-dark/90 text-white shadow-xl shadow-danger/20 text-lg"
                                loading={loading}
                            >
                                {loading ? 'Verificando...' : 'Acessar Backoffice'}
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center text-xs font-bold text-dark/30 uppercase tracking-wider flex flex-col items-center space-y-2">
                    <span>Acesso Registrado e Auditado</span>
                </div>
            </div>
        </div>
    )
}
