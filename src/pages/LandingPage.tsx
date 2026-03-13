import React, { useState, useEffect, useRef } from 'react';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [faqOpen, setFaqOpen] = useState<number | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const carouselInterval = useRef<NodeJS.Timeout | null>(null);

    // Common navigation and redirects
    const goToApp = () => { window.location.href = '/app'; };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        const navbar = document.querySelector('.navbar');
        const offset = navbar ? navbar.clientHeight : 80;

        if (element) {
            const startY = window.pageYOffset;
            const elementPosition = element.getBoundingClientRect().top;
            const targetY = elementPosition + startY - offset;
            const difference = targetY - startY;
            const duration = 800; // ms
            let start: number | null = null;

            const step = (timestamp: number) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const percent = Math.min(progress / duration, 1);

                // Easing: easeInOutQuad
                const eased = percent < 0.5 ? 2 * percent * percent : -1 + (4 - 2 * percent) * percent;

                window.scrollTo(0, startY + difference * eased);

                if (progress < duration) {
                    window.requestAnimationFrame(step);
                }
            };

            window.requestAnimationFrame(step);
        }
    };

    // Intersection Observer for Reveal animations
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        const reveals = document.querySelectorAll('.reveal');
        reveals.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    // Cursor Tracking
    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY });

            // Check if hovering over interactive elements
            const target = e.target as HTMLElement;
            const isInteractive = target.closest('button, a, .faq-item, .feature-card, .pricing-card');
            setIsHovering(!!isInteractive);
        };

        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, []);

    // Navbar Scroll logic
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Carousel Logic
    const carouselItems = [
        { type: 'laptop', src: '/screenshots/agenda-desktop.png', title: 'Painel Web Completo', desc: 'Gestão total pelo seu computador' },
        { type: 'phone', src: '/screenshots/agenda-mobile.png', title: 'Sua Agenda no Bolso', desc: 'Acesse tudo de qualquer lugar' },
        { type: 'phone', src: '/screenshots/financeiro-mobile.png', title: 'Controle Financeiro', desc: 'Seu faturamento na palma da mão' },
        { type: 'laptop', src: '/screenshots/clientes-desktop.png', title: 'Gestão de Clientes', desc: 'Histórico e dados organizados' }
    ];

    const nextSlide = () => {
        setCarouselIndex((prev) => (prev + 1) % carouselItems.length);
    };

    const prevSlide = () => {
        setCarouselIndex((prev) => (prev - 1 + carouselItems.length) % carouselItems.length);
    };

    const startAutoplay = () => {
        carouselInterval.current = setInterval(nextSlide, 3000);
    };

    const stopAutoplay = () => {
        if (carouselInterval.current) clearInterval(carouselInterval.current);
    };

    useEffect(() => {
        startAutoplay();
        return stopAutoplay;
    }, []);

    const getSlideState = (index: number) => {
        if (index === carouselIndex) return 'active';
        if (index === (carouselIndex - 1 + carouselItems.length) % carouselItems.length) return 'prev';
        if (index === (carouselIndex + 1) % carouselItems.length) return 'next';
        return 'hidden';
    };

    return (
        <div className="landing-page-exact">
            <div
                className={`custom-cursor-dot ${isHovering ? 'hover' : ''}`}
                style={{ transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)` }}
            />
            <div
                className={`custom-cursor-glow ${isHovering ? 'hover' : ''}`}
                style={{ transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0)` }}
            />
            {/* NAVBAR */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <a href="#" className="nav-logo">
                        <img src="/logo.png" alt="Agenda Pro" />
                    </a>
                    <ul className={`nav-links ${menuOpen ? 'open' : ''}`}>
                        <li><a href="#funcionalidades" onClick={(e) => { e.preventDefault(); scrollToSection('funcionalidades'); setMenuOpen(false); }}>Funcionalidades</a></li>
                        <li><a href="#como-funciona" onClick={(e) => { e.preventDefault(); scrollToSection('como-funciona'); setMenuOpen(false); }}>Como funciona</a></li>
                        <li><a href="#precos" onClick={(e) => { e.preventDefault(); scrollToSection('precos'); setMenuOpen(false); }}>Preços</a></li>
                        <li><a href="#faq" onClick={(e) => { e.preventDefault(); scrollToSection('faq'); setMenuOpen(false); }}>FAQ</a></li>
                        <li><button className="nav-btn-link" onClick={goToApp}>Acesse a plataforma</button></li>
                        <li><a href="#precos" className="nav-cta" onClick={(e) => { e.preventDefault(); scrollToSection('precos'); setMenuOpen(false); }}>Assinar agora</a></li>
                    </ul>
                    <div className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </nav>

            {/* HERO */}
            <section className="hero">
                <div className="hero-shape hero-shape-1"></div>
                <div className="hero-shape hero-shape-2"></div>
                <div className="hero-shape hero-shape-3"></div>
                <div className="container">
                    <div className="hero-content">
                        <div className="hero-badge"><div className="hero-badge-dot"></div>Usado por +500 profissionais no Brasil</div>
                        <h1>Pare de perder clientes.<br /><span className="highlight">Comece a usar a Agenda Pro.</span></h1>
                        <p className="hero-description">A agenda inteligente para empreendedores e autônomos que querem organizar, atender melhor e crescer — tudo em um só lugar.</p>
                        <div className="hero-actions">
                            <button onClick={goToApp} className="btn btn-primary">Começar agora →</button>
                            <a href="#funcionalidades" className="btn btn-outline" onClick={(e) => { e.preventDefault(); scrollToSection('funcionalidades'); }}>Ver funcionalidades</a>
                        </div>
                        <div className="hero-trust">
                            <span className="hero-trust-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#0D9E8A" /><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                Cancele quando quiser
                            </span>
                            <span className="hero-trust-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#0D9E8A" /><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                Suporte dedicado
                            </span>
                            <span className="hero-trust-item">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#0D9E8A" /><path d="M5 8l2 2 4-4" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                                Planos a partir de R$16,42/mês
                            </span>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-devices">
                            <div className="hero-laptop">
                                <div className="hero-laptop-lid">
                                    <div className="hero-laptop-screen">
                                        <img src="/screenshots/agenda-desktop.png" alt="Painel Web" />
                                    </div>
                                </div>
                                <div className="hero-laptop-hinge"></div>
                                <div className="hero-laptop-base"></div>
                            </div>
                            <div className="hero-phone">
                                <div className="hero-phone-frame">
                                    <div className="hero-phone-screen">
                                        <img src="/screenshots/agenda-mobile.png" alt="App Mobile" />
                                    </div>
                                </div>
                            </div>
                            <div className="hero-notification">
                                <div className="notif-icon">📅</div>
                                <div className="notif-content">
                                    <div className="notif-text">Novo agendamento!</div>
                                    <div className="notif-sub">Corte de Cabelo — 14:30</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF */}
            <div className="social-proof">
                <div className="container">
                    <p className="social-proof-text">Ideal para profissionais de <strong>vários ramos</strong></p>
                    <div className="social-proof-slider">
                        <div className="social-proof-icons">
                            {/* Primeira metade */}
                            <div className="sp-icon"><div className="sp-icon-circle">✂️</div><span className="sp-icon-label">Barbeiros</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">💪</div><span className="sp-icon-label">Personal</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🍎</div><span className="sp-icon-label">Nutris</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🦷</div><span className="sp-icon-label">Dentistas</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🎨</div><span className="sp-icon-label">Designers</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">💅</div><span className="sp-icon-label">Estética</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🧠</div><span className="sp-icon-label">Terapeutas</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">📸</div><span className="sp-icon-label">Fotógrafos</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">👔</div><span className="sp-icon-label">Consultores</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🩺</div><span className="sp-icon-label">Médicos</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">⚖️</div><span className="sp-icon-label">Advogados</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🧘</div><span className="sp-icon-label">Psicólogos</span></div>

                            {/* Duplicado para loop infinito */}
                            <div className="sp-icon"><div className="sp-icon-circle">✂️</div><span className="sp-icon-label">Barbeiros</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">💪</div><span className="sp-icon-label">Personal</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🍎</div><span className="sp-icon-label">Nutris</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🦷</div><span className="sp-icon-label">Dentistas</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🎨</div><span className="sp-icon-label">Designers</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">💅</div><span className="sp-icon-label">Estética</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🧠</div><span className="sp-icon-label">Terapeutas</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">📸</div><span className="sp-icon-label">Fotógrafos</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">👔</div><span className="sp-icon-label">Consultores</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🩺</div><span className="sp-icon-label">Médicos</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">⚖️</div><span className="sp-icon-label">Advogados</span></div>
                            <div className="sp-icon"><div className="sp-icon-circle">🧘</div><span className="sp-icon-label">Psicólogos</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FEATURES */}
            <section id="funcionalidades" className="features">
                <div className="container">
                    <div className="reveal"><span className="section-tag">Funcionalidades</span></div>
                    <h2 className="section-title reveal reveal-delay-1">Tudo o que seu negócio precisa</h2>
                    <p className="section-subtitle reveal reveal-delay-2">Esqueça a bagunça do WhatsApp e das planilhas. Centralize sua gestão em uma plataforma pensada para você.</p>

                    <div className="features-grid">
                        <div className="feature-card reveal reveal-delay-1">
                            <div className="feature-icon fi-blue">📅</div>
                            <h3 className="feature-title">Agendamento Online</h3>
                            <p className="feature-desc">Link exclusivo para seu cliente agendar sozinho 24h por dia, sem precisar te chamar.</p>
                        </div>
                        <div className="feature-card reveal reveal-delay-2">
                            <div className="feature-icon fi-teal">👥</div>
                            <h3 className="feature-title">Gestão de Clientes</h3>
                            <p className="feature-desc">Saiba quem são seus clientes mais fiéis e tenha o histórico completo de cada um.</p>
                        </div>
                        <div className="feature-card reveal reveal-delay-3">
                            <div className="feature-icon fi-amber">💰</div>
                            <h3 className="feature-title">Controle Financeiro</h3>
                            <p className="feature-desc">Veja quanto faturou no dia, na semana e no mês com relatórios automáticos.</p>
                        </div>
                        <div className="feature-card reveal reveal-delay-1">
                            <div className="feature-icon fi-teal">📱</div>
                            <h3 className="feature-title">Lembretes Automáticos</h3>
                            <p className="feature-desc">Reduza em até 80% as faltas com lembretes inteligentes por WhatsApp.</p>
                        </div>
                        <div className="feature-card reveal reveal-delay-2">
                            <div className="feature-icon fi-blue">📊</div>
                            <h3 className="feature-title">Métricas de Crescimento</h3>
                            <p className="feature-desc">Acompanhe a evolução do seu negócio com gráficos claros e objetivos.</p>
                        </div>
                        <div className="feature-card reveal reveal-delay-3">
                            <div className="feature-icon fi-amber">🛡️</div>
                            <h3 className="feature-title">Personalização Total</h3>
                            <p className="feature-desc">Deixe a plataforma com a sua cara, alterando cores, logos e serviços.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="como-funciona" className="how-it-works">
                <div className="container">
                    <span className="section-tag reveal">Processo</span>
                    <h2 className="section-title reveal reveal-delay-1">Como funciona?</h2>
                    <p className="section-subtitle reveal reveal-delay-2">Profissionalize seu atendimento em menos de 5 minutos.</p>

                    <div className="steps-container">
                        <div className="step-card reveal reveal-delay-1">
                            <div className="step-number">1</div>
                            <div className="step-icon">📝</div>
                            <h3 className="step-title">Crie sua conta</h3>
                            <p className="step-desc">Cadastre seu negócio e configure seus serviços em instantes.</p>
                        </div>
                        <div className="step-card reveal reveal-delay-2">
                            <div className="step-number">2</div>
                            <div className="step-icon">🔗</div>
                            <h3 className="step-title">Divulgue seu link</h3>
                            <p className="step-desc">Coloque o link na sua bio do Instagram ou envie para seus clientes.</p>
                        </div>
                        <div className="step-card reveal reveal-delay-3">
                            <div className="step-number">3</div>
                            <div className="step-icon">🚀</div>
                            <h3 className="step-title">Veja crescer</h3>
                            <p className="step-desc">Receba notificações de novos agendamentos e foque em atender.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SCREENSHOTS CAROUSEL */}
            <section className="screenshots">
                <div className="container">
                    <h2 className="section-title reveal">Interface moderna e intuitiva</h2>
                    <p className="section-subtitle reveal reveal-delay-1">Desenvolvido para oferecer a melhor experiência em qualquer dispositivo.</p>

                    <div className="carousel-wrapper" onMouseEnter={stopAutoplay} onMouseLeave={startAutoplay}>
                        <div className="carousel-track" id="carouselTrack">
                            {carouselItems.map((item, idx) => (
                                <div key={idx} className="carousel-item" data-state={getSlideState(idx)}>
                                    {item.type === 'laptop' ? (
                                        <div className="c-laptop">
                                            <div className="c-laptop-lid">
                                                <div className="c-laptop-screen"><img src={item.src} alt={item.title} /></div>
                                            </div>
                                            <div className="c-laptop-hinge"></div>
                                            <div className="c-laptop-base"></div>
                                        </div>
                                    ) : (
                                        <div className="c-phone">
                                            <div className="c-phone-frame">
                                                <div className="c-phone-screen"><img src={item.src} alt={item.title} /></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="carousel-info">
                            {carouselItems.map((item, idx) => (
                                <div key={idx} className={`carousel-info-slide ${idx === carouselIndex ? 'active' : ''}`}>
                                    <h3 className="carousel-label-title">{item.title}</h3>
                                    <p className="carousel-label-desc">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="carousel-nav">
                            <button className="carousel-arrow" onClick={prevSlide}>❮</button>
                            <div className="carousel-dots">
                                {carouselItems.map((_, idx) => (
                                    <span
                                        key={idx}
                                        className={`carousel-dot ${idx === carouselIndex ? 'active' : ''}`}
                                        onClick={() => setCarouselIndex(idx)}
                                    ></span>
                                ))}
                            </div>
                            <button className="carousel-arrow" onClick={nextSlide}>❯</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING */}
            <section id="precos" className="pricing">
                <div className="container">
                    <span className="section-tag reveal">Preços</span>
                    <h2 className="section-title reveal reveal-delay-1">O plano certo para você</h2>
                    <p className="section-subtitle reveal reveal-delay-2">Sem taxas de adesão, sem multas. Transparência total para o seu negócio.</p>

                    <div className="pricing-grid">
                        <div className="pricing-card reveal reveal-delay-1">
                            <h3 className="pricing-plan-name">Mensal</h3>
                            <div className="pricing-old-price">R$ 39,90</div>
                            <div className="pricing-price">R$ 19,90<span className="pricing-price-period">/mês</span></div>
                            <div className="pricing-discount-badge">50% OFF</div>
                            <div className="pricing-divider"></div>
                            <ul className="pricing-features">
                                <li>✅ Agendamentos Ilimitados</li>
                                <li>✅ Gestão de Clientes</li>
                                <li>✅ Relatórios Básicos</li>
                                <li>✅ Suporte por Chat</li>
                            </ul>
                            <button onClick={() => window.location.href = 'https://pay.cakto.com.br/bo4xrwq_803782'} className="btn btn-outline" style={{ width: '100%' }}>Assinar Agora</button>
                        </div>

                        <div className="pricing-card featured reveal reveal-delay-2">
                            <div className="pricing-popular-badge">MAIS VANTAJOSO</div>
                            <h3 className="pricing-plan-name">Anual</h3>
                            <div className="pricing-old-price">R$ 478,80</div>
                            <div className="pricing-price">R$ 197,00<span className="pricing-price-period">/ano</span></div>
                            <div className="pricing-equivalent">R$ 16,42/mês</div>
                            <div className="pricing-discount-badge">ECONOMIZE 59%</div>
                            <div className="pricing-divider"></div>
                            <ul className="pricing-features">
                                <li>🔥 Tudo do Mensal</li>
                                <li>🔥 Lembretes WhatsApp</li>
                                <li>🔥 Painel Financeiro Premium</li>
                                <li>🔥 Suporte Prioritário</li>
                                <li>🔥 Multi-usuários (Em breve)</li>
                            </ul>
                            <button onClick={() => window.location.href = 'https://pay.cakto.com.br/36rjwdm'} className="btn btn-accent" style={{ width: '100%' }}>Assinar Agora</button>
                        </div>
                    </div>

                    <div className="pricing-footer reveal" style={{ marginTop: '40px' }}>
                        <div className="pricing-footer-item">🔒 Pagamento Seguro</div>
                        <div className="pricing-footer-item">💳 Sem burocracia</div>
                        <div className="pricing-footer-item">✨ 7 dias de garantia</div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIALS */}
            <section className="testimonials">
                <div className="container">
                    <h2 className="section-title reveal">Depoimentos</h2>
                    <div className="testimonials-grid">
                        <div className="testimonial-card reveal reveal-delay-1">
                            <div className="testimonial-stars">★★★★★</div>
                            <p className="testimonial-text">"Minha vida mudou depois do Agenda Pro. Meus clientes adoram a facilidade de agendar direto pelo link no Instagram."</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar ta-blue">RS</div>
                                <div>
                                    <div className="testimonial-name">Ricardo Silva</div>
                                    <div className="testimonial-role">Barbeiro</div>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal reveal-delay-2">
                            <div className="testimonial-stars">★★★★★</div>
                            <p className="testimonial-text">"O melhor custo-benefício que já encontrei. O painel financeiro me ajuda a ter clareza total das minhas metas."</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar ta-teal">AM</div>
                                <div>
                                    <div className="testimonial-name">Alice Mendes</div>
                                    <div className="testimonial-role">Nutricionista</div>
                                </div>
                            </div>
                        </div>
                        <div className="testimonial-card reveal reveal-delay-3">
                            <div className="testimonial-stars">★★★★★</div>
                            <p className="testimonial-text">"Os lembretes automáticos reduziram drasticamente as faltas dos meus alunos. Excelente ferramenta!"</p>
                            <div className="testimonial-author">
                                <div className="testimonial-avatar ta-amber">JP</div>
                                <div>
                                    <div className="testimonial-name">João Paulo</div>
                                    <div className="testimonial-role">Personal Trainer</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="faq">
                <div className="container">
                    <h2 className="section-title reveal">Dúvidas Frequentes</h2>
                    <div className="faq-list reveal reveal-delay-1">
                        {[
                            { q: 'Como faço para receber pagamentos?', a: 'Você configurar suas contas bancárias no painel e o sistema calcula automaticamente seus ganhos baseados nos agendamentos confirmados.' },
                            { q: 'Preciso instalar algum aplicativo?', a: 'O Agenda Pro é uma plataforma web (PWA), o que significa que funciona perfeitamente no navegador do computador e do celular, podendo ser adicionado à tela inicial como um app.' },
                            { q: 'Meus dados estão seguros?', a: 'Sim, utilizamos criptografia de ponta e servidores seguros para garantir que todas as suas informações e de seus clientes estejam protegidas.' },
                            { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você tem total liberdade para cancelar sua assinatura quando desejar, sem custos adicionais ou fidelidade.' }
                        ].map((item, idx) => (
                            <div key={idx} className={`faq-item ${faqOpen === idx ? 'open' : ''}`} onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}>
                                <div className="faq-question">
                                    <span className="faq-question-text">{item.q}</span>
                                    <span className="faq-chevron">⌄</span>
                                </div>
                                <div className="faq-answer">
                                    <div className="faq-answer-text">{item.a}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FINAL CTA */}
            <section className="final-cta">
                <div className="container">
                    <h2 className="section-title reveal">Transforme sua gestão hoje</h2>
                    <p className="section-subtitle reveal reveal-delay-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Junte-se a centenas de profissionais que já usam o Agenda Pro e profissionalize seu negócio.</p>
                    <div className="final-cta-actions reveal reveal-delay-2" style={{ marginTop: '32px' }}>
                        <a href="#precos" onClick={(e) => { e.preventDefault(); scrollToSection('precos'); }} className="btn btn-white">Escolher meu Plano</a>
                    </div>
                    <p className="final-cta-note reveal reveal-delay-3">Planos a partir de R$16,42/mês • 7 dias de garantia total</p>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-brand">
                        <img src="/logo.png" alt="Agenda Pro" />
                    </div>
                    <div className="footer-links">
                        <a href="#">Termos de Uso</a>
                        <a href="#">Privacidade</a>
                        <a href="#">Contato</a>
                    </div>
                    <div className="footer-copy">
                        © 2026 Agenda Pro — Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};
