import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
    Calendar, Users, DollarSign, Bell, BarChart2, Palette,
    Smartphone, Star, ChevronRight, CheckCircle, Menu, X,
    Zap, Clock, Shield, ArrowRight, Monitor, Package
} from 'lucide-react'

// ─── Scroll Animation Hook ─────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); obs.disconnect() } },
            { threshold }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [threshold])

    return { ref, isVisible }
}

// ─── Animated Wrapper ───────────────────────────────────────────────────────
const Anim: React.FC<{
    children: React.ReactNode
    className?: string
    delay?: number
    from?: 'bottom' | 'left' | 'right' | 'scale'
}> = ({ children, className = '', delay = 0, from = 'bottom' }) => {
    const { ref, isVisible } = useInView(0.1)

    const baseStyle: React.CSSProperties = {
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    }

    const hiddenTransform = {
        bottom: 'translateY(40px)',
        left: 'translateX(-40px)',
        right: 'translateX(40px)',
        scale: 'scale(0.92)',
    }

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...baseStyle,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'none' : hiddenTransform[from],
            }}
        >
            {children}
        </div>
    )
}

// ─── Data ─────────────────────────────────────────────────────────────────
const audiences = [
    'Barbeiros', 'Personal Trainers', 'Nutricionistas', 'Consultores',
    'Fotógrafos', 'Designers', 'Terapeutas', 'Psicólogos',
    'Manicures', 'Esteticistas', 'Coaches', 'e muito mais...'
]

const pains = [
    { text: 'Agenda espalhada entre WhatsApp, caderno e planilhas' },
    { text: 'Perda de clientes por esquecimento ou confusão de horários' },
    { text: 'Falta de controle financeiro dos atendimentos' },
    { text: 'Dificuldade em escalar sem uma ferramenta profissional' },
]

const solutions = [
    { text: 'Tudo centralizado em um só lugar' },
    { text: 'Transmita mais profissionalismo aos seus clientes' },
    { text: 'Gaste menos tempo organizando, mais tempo atendendo' },
    { text: 'Cresça com controle e visibilidade sobre o negócio' },
]

// ─── CSS Device Mockup Components ──────────────────────────────────────────
const PhoneMockup: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
    <div className={`relative inline-block ${className}`}>
        <div className="relative bg-gray-900 rounded-[40px] p-2.5 shadow-2xl shadow-gray-900/30">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-900 rounded-b-2xl z-20" />
            <div className="relative rounded-[32px] overflow-hidden bg-white" style={{ width: '260px', height: '560px' }}>
                <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
            </div>
        </div>
    </div>
)

const LaptopMockup: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className = '' }) => (
    <div className={`relative inline-block ${className}`}>
        <div className="bg-gray-900 rounded-t-xl p-2 shadow-2xl shadow-gray-900/20">
            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-700 rounded-full z-20" />
            <div className="rounded-lg overflow-hidden bg-white" style={{ width: '100%', maxWidth: '680px', aspectRatio: '16/10' }}>
                <img src={src} alt={alt} className="w-full h-full object-cover object-top" />
            </div>
        </div>
        <div className="bg-gradient-to-b from-gray-800 to-gray-700 h-4 rounded-b-xl mx-auto" style={{ width: '110%', marginLeft: '-5%' }}>
            <div className="bg-gray-600 h-1 w-16 rounded-b-sm mx-auto" />
        </div>
    </div>
)

// ─── Smooth scroll handler ──────────────────────────────────────────────────
const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ═══════════════════════════════════════════════════════════════════════════
export const LandingPage: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', onScroll)
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const goToApp = () => { window.location.href = '/app' }

    return (
        <div className="min-h-screen bg-white text-dark font-sans overflow-x-hidden select-auto" style={{ userSelect: 'auto' }}>

            {/* ── NAVBAR ── */}
            <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm' : 'bg-transparent'}`}>
                <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
                    <img src="/logo.png" alt="Agenda Pro" className="h-10 object-contain" />
                    <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-dark/60">
                        <a href="#funcionalidades" onClick={(e) => smoothScroll(e, 'funcionalidades')} className="hover:text-primary transition-colors">Funcionalidades</a>
                        <a href="#para-quem" onClick={(e) => smoothScroll(e, 'para-quem')} className="hover:text-primary transition-colors">Para quem</a>
                        <a href="#missao" onClick={(e) => smoothScroll(e, 'missao')} className="hover:text-primary transition-colors">Missão</a>
                    </nav>
                    <div className="hidden md:flex items-center space-x-3">
                        <button onClick={goToApp} className="px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 rounded-xl transition-colors">Entrar</button>
                        <button onClick={goToApp} className="px-5 py-2.5 text-sm font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-2">
                            Começar grátis <ArrowRight size={16} />
                        </button>
                    </div>
                    <button className="md:hidden p-2 text-dark/60" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
                {menuOpen && (
                    <div className="md:hidden bg-white border-t border-surface-neutral px-6 py-4 space-y-4 fade-in">
                        <a href="#funcionalidades" onClick={(e) => { smoothScroll(e, 'funcionalidades'); setMenuOpen(false) }} className="block font-semibold text-dark/60 py-2">Funcionalidades</a>
                        <a href="#para-quem" onClick={(e) => { smoothScroll(e, 'para-quem'); setMenuOpen(false) }} className="block font-semibold text-dark/60 py-2">Para quem</a>
                        <button onClick={goToApp} className="w-full py-3 font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/30">Acessar App</button>
                    </div>
                )}
            </header>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-4xl mx-auto space-y-8">
                    <Anim from="scale" delay={100}>
                        <img src="/logo.png" alt="Agenda Pro" className="h-24 sm:h-28 mx-auto object-contain drop-shadow-xl" />
                    </Anim>
                    <Anim delay={300}>
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-dark leading-tight">
                                Organize.{' '}<span className="text-primary">Atenda.</span>{' '}Cresça.
                            </h1>
                            <p className="text-lg sm:text-xl text-dark/60 leading-relaxed max-w-xl mx-auto">
                                Sua agenda profissional, na palma da mão. O app de gestão para empreendedores e autônomos que querem escalar seus negócios.
                            </p>
                        </div>
                    </Anim>

                    <Anim delay={500}>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button onClick={goToApp} className="px-8 py-4 font-bold text-base bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2">
                                Começar agora — é grátis <ArrowRight size={18} />
                            </button>
                            <a href="#funcionalidades" onClick={(e) => smoothScroll(e, 'funcionalidades')} className="px-8 py-4 font-bold text-base bg-white border-2 border-surface-neutral text-dark/70 rounded-2xl hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-2">
                                Ver funcionalidades <ChevronRight size={18} />
                            </a>
                        </div>
                    </Anim>

                    <Anim delay={700}>
                        <div className="flex items-center justify-center gap-6 text-sm text-dark/40 font-medium flex-wrap">
                            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> Sem cartão de crédito</span>
                            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> App Mobile + Web</span>
                            <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-primary" /> Configuração em minutos</span>
                        </div>
                    </Anim>
                </div>
            </section>

            {/* ── MOCKUP HERO ── */}
            <section className="py-12 px-6 bg-gradient-to-b from-white to-surface-light overflow-hidden">
                <div className="max-w-6xl mx-auto">
                    <Anim>
                        <div className="text-center mb-12 space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full">
                                <Monitor size={12} className="inline mr-1.5 -mt-0.5" />
                                Disponível em todos os dispositivos
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark mt-4">
                                Uma interface feita para você
                            </h2>
                            <p className="text-dark/50 max-w-xl mx-auto">
                                Interface responsiva que se adapta perfeitamente do celular ao computador. Gerencie de qualquer lugar.
                            </p>
                        </div>
                    </Anim>

                    <Anim from="scale" delay={200}>
                        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                            <div className="flex gap-6 items-end">
                                <PhoneMockup src="/screenshots/agenda-mobile.png" alt="Agenda Mobile" />
                                <PhoneMockup src="/screenshots/financeiro-mobile.png" alt="Financeiro Mobile" className="hidden sm:block" />
                            </div>
                            <div className="hidden md:block" style={{ maxWidth: '520px' }}>
                                <LaptopMockup src="/screenshots/agenda-desktop.png" alt="Agenda Desktop" />
                            </div>
                        </div>
                    </Anim>
                </div>
            </section>

            {/* ── FEATURE 1: AGENDAMENTO ── */}
            <section id="funcionalidades" className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <Anim from="left" className="space-y-6 order-2 lg:order-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Calendar size={24} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">Agendamento</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark leading-tight">
                                Sua agenda completa, organizada por horário
                            </h2>
                            <p className="text-dark/60 text-lg leading-relaxed">
                                Visualize todos os seus atendimentos do dia em uma grade intuitiva. No celular, deslize entre os dias com facilidade. No computador, veja a semana inteira de uma vez.
                            </p>
                            <ul className="space-y-3">
                                {['Visão diária no celular com swipe entre dias', 'Visão semanal completa no computador', 'Botão rápido para criar agendamento em qualquer horário', 'Detalhes do cliente e serviço visíveis no card', 'Status do agendamento em tempo real'].map((item, i) => (
                                    <Anim key={i} delay={i * 100}>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle size={18} className="text-primary flex-shrink-0 mt-0.5" />
                                            <span className="text-dark/60 font-medium">{item}</span>
                                        </li>
                                    </Anim>
                                ))}
                            </ul>
                        </Anim>
                        <Anim from="right" delay={200} className="order-1 lg:order-2 flex justify-center">
                            <PhoneMockup src="/screenshots/agenda-mobile.png" alt="Agenda no celular" />
                        </Anim>
                    </div>
                </div>
            </section>

            {/* ── FEATURE 2: CLIENTES ── */}
            <section className="py-24 px-6 bg-surface-light">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <Anim from="left" className="flex justify-center">
                            <div style={{ maxWidth: '520px' }}>
                                <LaptopMockup src="/screenshots/clientes-desktop.png" alt="Gestão de Clientes" />
                            </div>
                        </Anim>
                        <Anim from="right" delay={200} className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center"><Users size={24} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Clientes</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark leading-tight">
                                Todos os seus clientes em um só lugar
                            </h2>
                            <p className="text-dark/60 text-lg leading-relaxed">
                                Cadastre, organize e acompanhe cada cliente. Veja o histórico completo de atendimentos, situação financeira, e acesse o perfil com um clique.
                            </p>
                            <ul className="space-y-3">
                                {['Cadastro completo com telefone, e-mail e anotações', 'Busca rápida e filtros (Todos, Ativos, Inadimplentes)', 'Status financeiro individual — veja quem está em dia ou devendo', 'Grid visual no computador para ver múltiplos clientes', 'Histórico de atendimentos por cliente', 'Sistema de pacotes com sessões pré-pagas'].map((item, i) => (
                                    <Anim key={i} delay={i * 100}>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle size={18} className="text-teal-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-dark/60 font-medium">{item}</span>
                                        </li>
                                    </Anim>
                                ))}
                            </ul>
                        </Anim>
                    </div>
                </div>
            </section>

            {/* ── FEATURE 3: FINANCEIRO ── */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <Anim from="left" className="space-y-6 order-2 lg:order-1">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><DollarSign size={24} /></div>
                                <span className="text-xs font-bold uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-full">Financeiro</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark leading-tight">
                                Saiba exatamente quanto entra no seu negócio
                            </h2>
                            <p className="text-dark/60 text-lg leading-relaxed">
                                Acompanhe tudo que recebeu, o que está pendente e a expectativa total do mês. Confirme pagamentos com um toque e identifique inadimplentes rapidamente.
                            </p>
                            <ul className="space-y-3">
                                {['Dashboard com Recebido, A Receber e Expectativa total', 'Confirmação de pagamento em PIX, cartão ou dinheiro', 'Histórico completo de todos os pagamentos', 'Lista de clientes com pagamento pendente', 'Integração automática com agendamentos', 'Pacotes de serviços com desconto e controle de sessões'].map((item, i) => (
                                    <Anim key={i} delay={i * 100}>
                                        <li className="flex items-start gap-3">
                                            <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-dark/60 font-medium">{item}</span>
                                        </li>
                                    </Anim>
                                ))}
                            </ul>
                        </Anim>
                        <Anim from="right" delay={200} className="order-1 lg:order-2 flex justify-center">
                            <PhoneMockup src="/screenshots/financeiro-mobile.png" alt="Financeiro Mobile" />
                        </Anim>
                    </div>
                </div>
            </section>

            {/* ── MORE FEATURES GRID ── */}
            <section className="py-24 px-6 bg-surface-light">
                <div className="max-w-6xl mx-auto">
                    <Anim>
                        <div className="text-center mb-16 space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full">E tem mais</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark mt-4">
                                Funcionalidades que fazem a diferença
                            </h2>
                        </div>
                    </Anim>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: Bell, title: 'Lembretes Automáticos', desc: 'Notificações inteligentes antes de cada agendamento. Configure de 10 minutos a 1 hora de antecedência para nunca perder um compromisso.', color: 'bg-orange-50 text-orange-600' },
                            { icon: Package, title: 'Pacotes de Serviços', desc: 'Venda pacotes com múltiplas sessões e desconto. O sistema deduz automaticamente ao agendar, mostrando quantas sessões restam para cada cliente.', color: 'bg-purple-50 text-purple-600' },
                            { icon: BarChart2, title: 'Relatórios & Métricas', desc: 'Dados em tempo real sobre o desempenho do seu negócio. Veja recebimentos, pendências e expectativas num só painel.', color: 'bg-pink-50 text-pink-600' },
                            { icon: Palette, title: 'Identidade Visual Própria', desc: 'Customize com seu logo e cores. Quando o cliente acessar, verá a sua marca — não um software genérico.', color: 'bg-indigo-50 text-indigo-600' },
                            { icon: Shield, title: 'Segurança Total', desc: 'Autenticação por e-mail, dados isolados por usuário, infraestrutura enterprise com Supabase e Row Level Security.', color: 'bg-green-50 text-green-600' },
                            { icon: Smartphone, title: 'PWA Instalável', desc: 'Instale direto no celular como um app nativo. Funciona offline, recebe notificações e abre na tela inicial.', color: 'bg-sky-50 text-sky-600' },
                        ].map((f, i) => (
                            <Anim key={i} from="bottom" delay={i * 120}>
                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-surface-neutral/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group h-full">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color} group-hover:scale-110 transition-transform`}>
                                        <f.icon size={24} />
                                    </div>
                                    <h3 className="font-bold text-dark text-lg mb-2">{f.title}</h3>
                                    <p className="text-dark/50 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </Anim>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROBLEMA vs SOLUÇÃO ── */}
            <section id="para-quem" className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <Anim>
                        <div className="text-center mb-16 space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-4 py-1.5 rounded-full">Para Quem É</span>
                            <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark mt-4">Você se identifica com isso?</h2>
                            <p className="text-dark/50 max-w-xl mx-auto">Para profissionais independentes que querem parar de improvisar e começar a crescer.</p>
                        </div>
                    </Anim>

                    <div className="grid md:grid-cols-2 gap-8">
                        <Anim from="left">
                            <div className="bg-red-50 rounded-3xl p-8 space-y-4 h-full">
                                <h3 className="font-bold text-xl text-dark mb-4">😣 Antes do Agenda Pro</h3>
                                {pains.map((p, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-5 h-5 bg-red-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><X size={10} className="text-red-600" /></div>
                                        <p className="text-dark/70 text-sm font-medium">{p.text}</p>
                                    </div>
                                ))}
                            </div>
                        </Anim>
                        <Anim from="right" delay={200}>
                            <div className="bg-green-50 rounded-3xl p-8 space-y-4 h-full">
                                <h3 className="font-bold text-xl text-dark mb-4">🚀 Com o Agenda Pro</h3>
                                {solutions.map((s, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-dark/70 text-sm font-medium">{s.text}</p>
                                    </div>
                                ))}
                            </div>
                        </Anim>
                    </div>

                    <Anim delay={300}>
                        <div className="mt-16 text-center space-y-6">
                            <h3 className="font-bold text-dark/50 uppercase text-sm tracking-wider">Perfeito para</h3>
                            <div className="flex flex-wrap gap-3 justify-center">
                                {audiences.map((a, i) => (
                                    <span key={i} className="px-4 py-2 bg-white border-2 border-surface-neutral text-dark/70 text-sm font-semibold rounded-full hover:border-primary/40 hover:text-primary transition-colors">{a}</span>
                                ))}
                            </div>
                        </div>
                    </Anim>
                </div>
            </section>

            {/* ── STATS ── */}
            <section className="py-16 bg-gradient-to-r from-primary via-primary to-blue-700 text-white">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    {[
                        { value: '100%', label: 'Digital & Mobile' },
                        { value: '< 5min', label: 'Para configurar' },
                        { value: '0', label: 'Conflitos de agenda' },
                        { value: '24h', label: 'Acesso a qualquer hora' },
                    ].map((s, i) => (
                        <Anim key={i} from="bottom" delay={i * 150}>
                            <div>
                                <p className="text-3xl sm:text-4xl font-display font-bold">{s.value}</p>
                                <p className="text-white/70 text-sm font-medium mt-1">{s.label}</p>
                            </div>
                        </Anim>
                    ))}
                </div>
            </section>

            {/* ── BENEFICIOS ── */}
            <section className="py-24 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        {[
                            { icon: Zap, title: 'Rápido de Configurar', desc: 'Em menos de 5 minutos, seu negócio está digital e pronto para receber agendamentos.', color: 'text-yellow-500 bg-yellow-50' },
                            { icon: Smartphone, title: 'Mobile First', desc: 'Funciona perfeitamente no celular, tablet e computador. Onde você estiver, sua agenda está junto.', color: 'text-primary bg-primary/10' },
                            { icon: Shield, title: 'Seguro e Confiável', desc: 'Seus dados protegidos com infraestrutura enterprise. Acesso seguro com autenticação moderna.', color: 'text-green-600 bg-green-50' },
                        ].map((b, i) => (
                            <Anim key={i} from="bottom" delay={i * 200}>
                                <div className="space-y-4">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${b.color}`}>
                                        <b.icon size={28} />
                                    </div>
                                    <h3 className="font-bold text-xl text-dark">{b.title}</h3>
                                    <p className="text-dark/50 leading-relaxed">{b.desc}</p>
                                </div>
                            </Anim>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── MISSÃO ── */}
            <section id="missao" className="py-24 px-6 bg-dark text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400 rounded-full blur-3xl" />
                </div>
                <Anim from="scale">
                    <div className="relative max-w-3xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold leading-tight">Nossa Missão</h2>
                        <p className="text-white/70 text-lg leading-relaxed">
                            Simplificar a gestão do dia a dia de empreendedores e autônomos, oferecendo uma ferramenta intuitiva que transforma organização em resultado.
                        </p>
                        <div className="grid sm:grid-cols-3 gap-6 pt-4">
                            {['Simplicidade', 'Confiança', 'Agilidade'].map((v, i) => (
                                <Anim key={i} from="bottom" delay={i * 200}>
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                                        <Star size={18} className="text-yellow-400 mb-2 mx-auto" />
                                        <p className="font-bold text-white">{v}</p>
                                    </div>
                                </Anim>
                            ))}
                        </div>
                    </div>
                </Anim>
            </section>

            {/* ── CTA FINAL ── */}
            <section className="py-24 px-6">
                <Anim from="scale">
                    <div className="max-w-2xl mx-auto text-center space-y-8">
                        <h2 className="text-3xl sm:text-4xl font-display font-bold text-dark">Pronto para organizar sua agenda?</h2>
                        <p className="text-dark/50 text-lg">Junte-se a centenas de profissionais que já estão crescendo com o Agenda Pro.</p>
                        <button onClick={goToApp} className="px-10 py-5 font-bold text-lg bg-primary text-white rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all inline-flex items-center gap-3">
                            Começar agora — grátis <ArrowRight size={20} />
                        </button>
                        <p className="text-sm text-dark/30 font-medium">Sem cartão de crédito. Configuração em minutos.</p>
                    </div>
                </Anim>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-dark text-white/40 py-12 px-6">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <img src="/logo.png" alt="Agenda Pro" className="h-8 object-contain brightness-0 invert opacity-50" />
                    <p className="text-sm font-medium text-center">© 2025 Agenda Pro — Todos os direitos reservados.</p>
                    <p className="text-xs font-bold uppercase tracking-widest">agendaprobr.com</p>
                </div>
            </footer>
        </div>
    )
}
