import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Button } from '../components/Button'
import { Lock, AlertCircle, ArrowRight } from 'lucide-react'

export const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        // A Supabase session token in URL hash is expected since the user followed a recovery link.
        // It's processed automatically by Supabase Auth and AuthContext. 
        // We just ensure we are here legally.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError("Link inválido ou expirado. Por favor, solicite a redefinição de senha novamente.")
            }
        })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            return
        }

        setLoading(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) throw updateError

            setSuccess(true)

            // Redirect after 3 seconds
            setTimeout(() => {
                window.location.href = '/'
            }, 3000)

        } catch (err: any) {
            console.error('Update password error:', err)
            setError(err.message || 'Ocorreu um erro ao atualizar a senha.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-6 text-center bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-surface-light to-primary/10">
            <div className="flex flex-col items-center mb-8">
                <img src="/logo.png" alt="Agenda Pro" className="w-64 md:w-80 h-auto mb-4 object-contain filter drop-shadow-md hover:scale-[1.02] transition-transform" />
                <h1 className="text-3xl font-display font-bold text-dark tracking-tight mb-2">Definir Nova Senha</h1>
                <p className="text-dark/40 font-medium text-md leading-relaxed max-w-[280px]">
                    Crie uma senha segura para o seu acesso.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-ios-lg flex items-center space-x-3 text-left animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="bg-primary/10 text-primary p-4 rounded-ios-lg flex items-center space-x-3 text-left animate-in fade-in slide-in-from-top-2">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-bold">Senha definida com sucesso! Redirecionando para o sistema...</p>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                        <input
                            type="password"
                            required
                            placeholder="Nova senha"
                            className="w-full h-14 pl-12 pr-4 bg-white/50 border-2 border-transparent focus:border-primary/30 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={success}
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                        <input
                            type="password"
                            required
                            placeholder="Confirme a nova senha"
                            className="w-full h-14 pl-12 pr-4 bg-white/50 border-2 border-transparent focus:border-primary/30 rounded-2xl outline-none transition-all placeholder:text-dark/30 font-medium text-dark"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={success}
                        />
                    </div>
                </div>

                <Button
                    type="submit"
                    loading={loading}
                    disabled={success}
                    className="w-full h-16 text-lg shadow-xl shadow-primary/20 mt-6 flex items-center justify-center"
                >
                    Salvar e Entrar
                    {!loading && <ArrowRight size={20} className="ml-2" />}
                </Button>
            </form>
        </div>
    )
}
