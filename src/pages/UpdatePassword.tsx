import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import {
    Lock, ArrowRight, CheckCircle2, AlertCircle,
    Eye, EyeOff, Shield, Zap, Star
} from 'lucide-react'

// Password strength helpers
const getStrength = (pwd: string) => {
    if (pwd.length === 0) return 0
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 10) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
}

const strengthInfo = [
    { label: '', color: '#E5E7EB', width: '0%' },
    { label: 'Fraca', color: '#E55B5B', width: '25%' },
    { label: 'Fraca', color: '#F59E0B', width: '50%' },
    { label: 'Média', color: '#F59E0B', width: '60%' },
    { label: 'Forte', color: '#10B981', width: '85%' },
    { label: 'Ótima', color: '#0D9E8A', width: '100%' },
]

export const UpdatePassword: React.FC = () => {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [countdown, setCountdown] = useState(3)

    const strength = getStrength(password)
    const info = strengthInfo[Math.min(strength, 5)]

    // Countdown after success
    useEffect(() => {
        if (!success) return
        if (countdown === 0) { window.location.href = '/'; return }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [success, countdown])

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setError('Link inválido ou expirado. Solicite a redefinição de senha novamente.')
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
        } catch (err: any) {
            setError(err.message || 'Ocorreu um erro ao atualizar a senha.')
        } finally {
            setLoading(false)
        }
    }

    // Input style helpers
    const inputStyle: React.CSSProperties = {
        height: 52,
        background: 'white',
        border: '1.5px solid #E5E7EB',
        color: '#1A1A2E',
        boxSizing: 'border-box',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        borderRadius: 16,
        paddingLeft: 44,
        paddingRight: 44,
        fontSize: 14,
        fontWeight: 500,
        width: '100%',
    }

    const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.border = '1.5px solid #1A73E8'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.12)'
    }
    const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.style.border = '1.5px solid #E5E7EB'
        e.currentTarget.style.boxShadow = 'none'
    }

    return (
        <div className="min-h-screen flex" style={{ background: '#F8FAFB', fontFamily: 'Inter, sans-serif' }}>

            {/* ═══ LEFT — Form ═══════════════════════════════════════════════ */}
            <div className="flex flex-col justify-center items-center w-full lg:w-[46%] px-6 py-12 relative" style={{ minHeight: '100vh' }}>
                {/* Logo */}
                <div className="absolute top-8 left-8">
                    <img src="/logo.png" alt="Agenda Pro" className="h-9 object-contain" />
                </div>

                <div className="w-full max-w-sm">
                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2"
                            style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}>
                            {success ? 'Senha definida! 🎉' : 'Definir nova senha'}
                        </h1>
                        <p className="text-sm" style={{ color: '#6B7280' }}>
                            {success
                                ? `Redirecionando em ${countdown}s...`
                                : 'Crie uma senha segura para o seu acesso ao Agenda Pro.'}
                        </p>
                    </div>

                    {/* Success state */}
                    {success && (
                        <div className="mb-6 p-5 rounded-2xl flex flex-col items-center gap-3 text-center"
                            style={{ background: '#E6F7F5', border: '1.5px solid rgba(13,158,138,0.25)' }}>
                            <div className="w-14 h-14 rounded-full flex items-center justify-center"
                                style={{ background: '#0D9E8A' }}>
                                <CheckCircle2 size={28} color="white" />
                            </div>
                            <div>
                                <p className="font-bold text-base" style={{ color: '#0D9E8A' }}>Senha criada com sucesso!</p>
                                <p className="text-sm mt-1" style={{ color: '#0D9E8A80' }}>
                                    Você será redirecionado automaticamente em {countdown} segundo{countdown !== 1 ? 's' : ''}.
                                </p>
                            </div>
                            {/* Countdown bar */}
                            <div className="w-full h-1.5 rounded-full bg-white/60 overflow-hidden mt-1">
                                <div
                                    className="h-full rounded-full"
                                    style={{
                                        background: '#0D9E8A',
                                        width: `${(countdown / 3) * 100}%`,
                                        transition: 'width 1s linear',
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 p-4 rounded-2xl"
                            style={{ background: '#FEE2E2', border: '1.5px solid rgba(229,91,91,0.3)' }}>
                            <AlertCircle size={18} style={{ color: '#E55B5B', flexShrink: 0, marginTop: 1 }} />
                            <p className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    {!success && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* New password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                                    Nova senha
                                </label>
                                <div className="relative">
                                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: '#9CA3AF', pointerEvents: 'none' }} />
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        style={inputStyle}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: '#9CA3AF' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#1A73E8')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Strength bar */}
                                {password.length > 0 && (
                                    <div>
                                        <div className="h-1.5 rounded-full overflow-hidden mt-2" style={{ background: '#F3F4F6' }}>
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: info.width, background: info.color }} />
                                        </div>
                                        {info.label && (
                                            <p className="text-xs mt-1 font-semibold" style={{ color: info.color }}>
                                                Força: {info.label}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                                    Confirmar senha
                                </label>
                                <div className="relative">
                                    <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2"
                                        style={{ color: '#9CA3AF', pointerEvents: 'none' }} />
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        required
                                        placeholder="Repita a nova senha"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        style={{
                                            ...inputStyle,
                                            border: confirmPassword && confirmPassword !== password
                                                ? '1.5px solid #E55B5B'
                                                : confirmPassword && confirmPassword === password
                                                    ? '1.5px solid #0D9E8A'
                                                    : '1.5px solid #E5E7EB',
                                        }}
                                        onFocus={onFocus}
                                        onBlur={onBlur}
                                    />
                                    <button type="button" tabIndex={-1}
                                        onClick={() => setShowConfirm(v => !v)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: '#9CA3AF' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#1A73E8')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}>
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {/* Match indicator */}
                                {confirmPassword.length > 0 && (
                                    <p className="text-xs font-semibold" style={{
                                        color: confirmPassword === password ? '#0D9E8A' : '#E55B5B'
                                    }}>
                                        {confirmPassword === password ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                                    </p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 font-bold text-sm text-white rounded-2xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                style={{
                                    height: 52,
                                    marginTop: 8,
                                    background: 'linear-gradient(135deg, #1A73E8, #1565C0)',
                                    boxShadow: '0 6px 24px rgba(26,115,232,0.35)',
                                }}
                                onMouseEnter={e => {
                                    if (!e.currentTarget.disabled) {
                                        e.currentTarget.style.boxShadow = '0 10px 32px rgba(26,115,232,0.45)'
                                        e.currentTarget.style.transform = 'translateY(-1px)'
                                    }
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(26,115,232,0.35)'
                                    e.currentTarget.style.transform = 'none'
                                }}
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                                            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        Salvar e Entrar
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <p className="mt-10 text-center text-[10px] uppercase tracking-widest font-bold"
                        style={{ color: '#D1D5DB' }}>
                        Acesso verificado por e-mail · Agenda Pro © 2025
                    </p>
                </div>
            </div>

            {/* ═══ RIGHT — Info panel ════════════════════════════════════════ */}
            <div
                className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #1A73E8 0%, #1251B5 60%, #0D1A4A 100%)' }}
            >
                {/* Decorative blobs */}
                <div className="absolute pointer-events-none"
                    style={{
                        top: '-10%', right: '-10%', width: 400, height: 400,
                        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)', borderRadius: '50%'
                    }} />
                <div className="absolute pointer-events-none"
                    style={{
                        bottom: '-5%', left: '-8%', width: 320, height: 320,
                        background: 'radial-gradient(circle, rgba(13,158,138,0.2) 0%, transparent 70%)', borderRadius: '50%'
                    }} />
                {/* Grid texture */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

                <div className="relative z-10 flex flex-col items-center text-center px-12">
                    <img src="/logo.png" alt="Agenda Pro"
                        className="h-16 object-contain mb-8 brightness-0 invert opacity-90" />

                    <h2 className="text-2xl font-bold text-white mb-3"
                        style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Quase lá!
                    </h2>
                    <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 280 }}>
                        Defina uma senha segura para proteger o seu acesso ao Agenda Pro.
                    </p>

                    {/* Tips */}
                    {[
                        { icon: Shield, text: 'Use pelo menos 6 caracteres' },
                        { icon: Zap, text: 'Combine letras, números e símbolos' },
                        { icon: Star, text: 'Evite senhas óbvias como "123456"' },
                    ].map(({ icon: Icon, text }, i) => (
                        <div key={i} className="flex items-center gap-3 mb-4 w-full max-w-xs text-left">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.12)' }}>
                                <Icon size={16} color="rgba(255,255,255,0.85)" />
                            </div>
                            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                {text}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
