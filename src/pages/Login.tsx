import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Flower2, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react'

export const Login: React.FC = () => {
    const { signInWithEmail, signUpWithEmail, loading } = useAuth()
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
                await signUpWithEmail(email, password)
                setLocalError('Conta criada com sucesso! Verifique seu e-mail caso seja necessário, ou tente fazer o login.')
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
        <div className="min-h-screen bg-cream-light flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose/5 via-cream-light to-sage/5">
            <div className="w-24 h-24 bg-sage/10 rounded-3xl flex items-center justify-center text-sage mb-8 animate-pulse">
                <Flower2 size={48} strokeWidth={1.5} />
            </div>

            <div className="space-y-3 mb-12">
                <h1 className="text-4xl font-display font-bold text-dark tracking-tight">AgendaPro</h1>
                <p className="text-dark/40 font-medium text-lg leading-relaxed max-w-[280px]">
                    Gestão inteligente para impulsionar o seu negócio.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                {localError && (
                    <div className={`p-4 rounded-ios-lg flex items-center space-x-3 text-left animate-in fade-in slide-in-from-top-2 ${localError.includes('sucesso') ? 'bg-sage/10 text-sage' : 'bg-red-50 text-red-600'}`}>
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-bold">{localError}</p>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                        <input
                            type="email"
                            required
                            placeholder="Seu e-mail"
                            className="w-full h-14 pl-12 pr-4 bg-white/50 border-2 border-transparent focus:border-sage/30 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                        <input
                            type="password"
                            required
                            placeholder="Sua senha"
                            className="w-full h-14 pl-12 pr-4 bg-white/50 border-2 border-transparent focus:border-sage/30 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    loading={loading || isLoading}
                    className="w-full h-16 text-lg shadow-xl shadow-sage/20 mt-6 flex items-center justify-center"
                >
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                    {!loading && !isLoading && <ArrowRight size={20} className="ml-2" />}
                </Button>

                <div className="pt-6">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm font-bold text-sage hover:text-sage-dark transition-colors"
                    >
                        {isLogin ? 'Não tem uma conta? Crie agora' : 'Já tem uma conta? Entrar'}
                    </button>
                </div>

                <p className="text-[10px] uppercase font-bold text-dark/20 tracking-widest px-8 pt-4">
                    Ao {isLogin ? 'entrar' : 'criar conta'} você concorda com nossos termos e políticas
                </p>
            </form>

            <footer className="fixed bottom-12 text-[10px] font-bold text-dark/10 uppercase tracking-[0.2em]">
                Premium Wellness Experience
            </footer>
        </div>
    )
}
