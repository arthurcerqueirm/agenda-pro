import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, Calendar, Users, DollarSign, Bell } from 'lucide-react'

// ─── Preview slides cycling through app screens ───────────────────────────────
const PREVIEW_SLIDES = [
  {
    image: '/screenshots/agenda-mobile.png',
    title: 'Agenda Completa',
    desc: 'Visualize e gerencie todos os atendimentos do dia',
    icon: Calendar,
    color: '#1A73E8',
    bg: '#EBF3FD',
  },
  {
    image: '/screenshots/financeiro-mobile.png',
    title: 'Controle Financeiro',
    desc: 'Acompanhe recebimentos e inadimplências em tempo real',
    icon: DollarSign,
    color: '#0D9E8A',
    bg: '#E6F7F5',
  },
  {
    image: '/screenshots/clientes-desktop.png',
    title: 'Gestão de Clientes',
    desc: 'Todos os seus clientes organizados em um só lugar',
    icon: Users,
    color: '#7C3AED',
    bg: '#F3EFFE',
    isDesktop: true,
  },
]

const FEATURES = [
  { icon: Calendar, text: 'Agenda intuitiva' },
  { icon: DollarSign, text: 'Financeiro integrado' },
  { icon: Users, text: 'Gestão de clientes' },
  { icon: Bell, text: 'Lembretes automáticos' },
]

// ─── Phone mockup wrapper ──────────────────────────────────────────────────────
const PhoneMockup: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div className="relative" style={{ width: 220, flexShrink: 0 }}>
    <div
      className="relative rounded-[36px] overflow-hidden"
      style={{
        background: '#1a1a2e',
        padding: '10px 8px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.3), 0 0 0 1.5px rgba(255,255,255,0.1)',
      }}
    >
      {/* Notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-10 rounded-b-2xl"
        style={{ width: 80, height: 18, background: '#1a1a2e' }}
      />
      <div
        className="rounded-[28px] overflow-hidden bg-white"
        style={{ aspectRatio: '9/19.5', position: 'relative' }}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
      </div>
    </div>
  </div>
)

// ─── Desktop laptop wrapper ────────────────────────────────────────────────────
const LaptopMockup: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
  <div style={{ width: '100%', maxWidth: 480 }}>
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: '12px 12px 0 0',
        padding: '10px 10px 0',
        boxShadow: '0 30px 60px rgba(0,0,0,0.25)',
      }}
    >
      {/* Browser dots */}
      <div className="flex gap-1.5 mb-2 px-1">
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
        ))}
      </div>
      <div className="rounded-t-lg overflow-hidden" style={{ aspectRatio: '16/10' }}>
        <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
      </div>
    </div>
    <div
      style={{
        background: 'linear-gradient(180deg, #2d2d3e 0%, #1a1a2e 100%)',
        height: 14,
        borderRadius: '0 0 8px 8px',
        width: '110%',
        marginLeft: '-5%',
      }}
    />
  </div>
)

// ═══════════════════════════════════════════════════════════════════════════════
export const Login: React.FC = () => {
  const { signInWithEmail, sendPasswordResetEmail, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)
  const [fadeSlide, setFadeSlide] = useState(true)

  // Auto-cycle preview slides
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeSlide(false)
      setTimeout(() => {
        setSlideIdx(prev => (prev + 1) % PREVIEW_SLIDES.length)
        setFadeSlide(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const slide = PREVIEW_SLIDES[slideIdx]

  const getErrorMessage = (error: any) => {
    const message = error.message || ''
    if (message.includes('Invalid login credentials')) {
      return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
    }
    if (message.includes('Email not confirmed')) {
      return 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'
    }
    if (message.includes('User not found')) {
      return 'Não encontramos uma conta com este e-mail.'
    }
    if (message.includes('E-mail não está liberado')) {
      return 'Acesso não autorizado. Verifique se sua assinatura está ativa.'
    }
    return message || 'Ocorreu um erro inesperado. Tente novamente.'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setIsLoading(true)
    setIsSuccess(false)

    try {
      if (isLogin) {
        await signInWithEmail(email, password)
      } else {
        await sendPasswordResetEmail(email)
        setIsSuccess(true)
        setLocalError('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setLocalError(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setLocalError(null)
    setIsSuccess(false)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F8FAFB', fontFamily: 'Inter, sans-serif' }}>

      {/* ══════════════════════════════════════════════════════════
          LEFT — Form panel
      ══════════════════════════════════════════════════════════ */}
      <div
        className="flex flex-col justify-center items-center w-full lg:w-[46%] px-6 py-12 relative"
        style={{ minHeight: '100vh' }}
      >
        {/* Logo top-left */}
        <div className="absolute top-8 left-8">
          <img src="/logo.png" alt="Agenda Pro" className="h-9 object-contain" />
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}
            >
              {isLogin ? 'Bem-vindo de volta' : 'Recuperar Acesso'}
            </h1>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {isLogin
                ? 'Entre com seu e-mail e senha para continuar.'
                : 'Informe seu e-mail e enviaremos um link para criar sua senha.'}
            </p>
          </div>

          {/* Feedback message */}
          {localError && (
            <div
              className="mb-5 flex items-start gap-3 p-4 rounded-2xl text-left"
              style={{
                background: isSuccess ? '#E6F7F5' : '#FEE2E2',
                border: `1.5px solid ${isSuccess ? '#0D9E8A30' : '#E55B5B30'}`,
              }}
            >
              {isSuccess
                ? <CheckCircle2 size={18} style={{ color: '#0D9E8A', flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle size={18} style={{ color: '#E55B5B', flexShrink: 0, marginTop: 1 }} />}
              <p className="text-sm font-medium" style={{ color: isSuccess ? '#0D9E8A' : '#DC2626' }}>
                {localError}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                E-mail
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: '#9CA3AF' }}
                />
                <input
                  id="login-email"
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-13 pl-11 pr-4 rounded-2xl text-sm font-medium outline-none transition-all duration-200"
                  style={{
                    height: 52,
                    background: 'white',
                    border: '1.5px solid #E5E7EB',
                    color: '#1A1A2E',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1.5px solid #1A73E8'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.12)'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1.5px solid #E5E7EB'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
            </div>

            {/* Password */}
            {isLogin && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9CA3AF' }}>
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false)
                      setLocalError(null)
                    }}
                    className="text-[11px] font-bold text-primary hover:underline transition-all"
                  >
                    Esqueceu sua senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    style={{ color: '#9CA3AF' }}
                  />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 rounded-2xl text-sm font-medium outline-none transition-all duration-200"
                    style={{
                      height: 52,
                      background: 'white',
                      border: '1.5px solid #E5E7EB',
                      color: '#1A1A2E',
                      boxSizing: 'border-box',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.border = '1.5px solid #1A73E8'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,115,232,0.12)'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.border = '1.5px solid #E5E7EB'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
                    style={{ color: '#9CA3AF' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#1A73E8')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading || isLoading}
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
              {(loading || isLoading) ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Aguarde...
                </>
              ) : (
                <>
                  {isLogin ? 'Entrar' : 'Enviar Link de Recuperação'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: '#F0F0F0' }} />
            <span className="text-xs font-medium" style={{ color: '#D1D5DB' }}>ou</span>
            <div className="flex-1 h-px" style={{ background: '#F0F0F0' }} />
          </div>

          {/* Switch mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={switchMode}
              className="text-sm font-semibold transition-colors duration-200"
              style={{ color: '#1A73E8' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1565C0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1A73E8')}
            >
              {isLogin ? 'Primeiro acesso ou Esqueceu a senha? Clique aqui →' : '← Voltar para o Login'}
            </button>
          </div>

          {/* Footer note */}
          <p
            className="mt-10 text-center text-[10px] uppercase tracking-widest font-bold"
            style={{ color: '#D1D5DB' }}
          >
            Acesso verificado por e-mail · Agenda Pro © 2025
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          RIGHT — Animated preview panel (hidden on mobile)
      ══════════════════════════════════════════════════════════ */}
      <div
        className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #1A73E8 0%, #1251B5 60%, #0D1A4A 100%)',
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-10%', right: '-10%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: '-5%', left: '-8%',
            width: 320, height: 320,
            background: 'radial-gradient(circle, rgba(13,158,138,0.2) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-10 w-full">

          {/* Badge */}
          <div
            className="mb-8 px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }}
            />
            Agenda Pro — Versão 2025
          </div>

          {/* Mockup with transition */}
          <div
            style={{
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              opacity: fadeSlide ? 1 : 0,
              transform: fadeSlide ? 'translateY(0)' : 'translateY(10px)',
              display: 'flex',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            {slide.isDesktop ? (
              <LaptopMockup src={slide.image} alt={slide.title} />
            ) : (
              <PhoneMockup src={slide.image} alt={slide.title} />
            )}
          </div>

          {/* Slide info */}
          <div
            style={{
              transition: 'opacity 0.4s ease',
              opacity: fadeSlide ? 1 : 0,
            }}
          >
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl mb-3"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              {React.createElement(slide.icon, { size: 14, color: 'rgba(255,255,255,0.9)' })}
              <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {slide.title}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 320 }}>
              {slide.desc}
            </p>
          </div>

          {/* Dot navigation */}
          <div className="flex gap-2 mt-6">
            {PREVIEW_SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setFadeSlide(false); setTimeout(() => { setSlideIdx(i); setFadeSlide(true) }, 300) }}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === slideIdx ? 24 : 8,
                  height: 8,
                  background: i === slideIdx ? 'white' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </div>

          {/* Feature tags */}
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.75)',
                }}
              >
                <Icon size={12} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
