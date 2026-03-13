import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

export const Login: React.FC = () => {
    const { signInWithEmail, sendPasswordResetEmail, loading } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [localError, setLocalError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLocalError(null)
        setIsLoading(true)

        try {
            if (isLogin) {
                await signInWithEmail(email, password)
            } else {
                await sendPasswordResetEmail(email)
                setLocalError('E-mail enviado com sucesso! Verifique sua caixa de entrada para definir a sua senha.')
                setIsLogin(true)
            }
        } catch (error: any) {
            console.error('Auth error:', error)
            setLocalError(error.message || 'Ocorreu um erro na autenticação')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-4 sm:p-8 text-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-danger/5 via-surface-light to-primary/5">
            <div className="flex flex-col items-center mb-6 mt-[-4rem]">
                <img src="/logo.png" alt="Agenda Pro" className="w-[18rem] sm:w-[22rem] md:w-[26rem] h-auto mb-2 object-contain filter drop-shadow-lg hover:scale-[1.02] transition-transform" />
                <p className="text-dark/50 font-medium text-base sm:text-lg leading-relaxed max-w-[300px]">
                    Organize. Atenda. Cresça.<br />
                    <span className="text-sm text-dark/40">Sua agenda profissional, na palma da mão.</span>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
                {localError && (
                    <div className={`p-4 rounded-ios-lg flex items-center space-x-3 text-left animate-in fade-in slide-in-from-top-2 ${localError.includes('sucesso') ? 'bg-primary/10 text-primary' : 'bg-red-50 text-red-600'}`}>
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-bold">{localError}</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={22} />
                        <input
                            type="email"
                            required
                            placeholder="Seu e-mail"
                            className="w-full h-16 pl-12 pr-4 bg-white/60 border-2 border-transparent focus:border-primary/40 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark text-lg shadow-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    {isLogin && (
                        <div className="relative fade-in">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={22} />
                            <input
                                type="password"
                                required
                                placeholder="Sua senha"
                                className="w-full h-16 pl-12 pr-4 bg-white/60 border-2 border-transparent focus:border-primary/40 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark text-lg shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    loading={loading || isLoading}
                    className="w-full h-16 text-lg shadow-xl shadow-primary/20 mt-6 flex items-center justify-center"
                >
                    {isLogin ? 'Entrar' : 'Receber Link Seguro'}
                    {!loading && !isLoading && <ArrowRight size={20} className="ml-2" />}
                </Button>

                <div className="pt-6">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                    >
                        {isLogin ? 'Primeiro acesso? Crie sua senha' : 'Já tem uma senha? Fazer login'}
                    </button>
                </div>

                <p className="text-[10px] uppercase font-bold text-dark/20 tracking-widest px-8 pt-4">
                    Seu acesso é verificado por e-mail pelo nosso sistema
                </p>
            </form>

            <footer className="fixed bottom-12 text-[10px] font-bold text-dark/10 uppercase tracking-[0.2em]">
                Agenda Pro &copy; 2025
            </footer>
        </div>
    )
}
