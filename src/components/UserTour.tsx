import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles, Calendar, Users, Settings, DollarSign, Package, Clock, Plane, Link as LinkIcon } from 'lucide-react';
import './UserTour.css';

interface TourStep {
    targetId: string;
    title: string;
    description: string;
    position: 'bottom' | 'top' | 'left' | 'right';
    tab?: 'agenda' | 'clients' | 'finance' | 'admin';
    icon?: React.ReactNode;
}

const tourSteps: TourStep[] = [
    {
        targetId: 'tour-agenda',
        title: 'Bem-vindo(a)!',
        description: 'Vamos fazer um tour rápido para você conhecer as principais ferramentas do seu novo sistema de agendamento.',
        position: 'right',
        tab: 'agenda',
        icon: <Sparkles className="text-primary" size={24} />
    },
    {
        targetId: 'tour-new-apt',
        title: 'Novo Agendamento',
        description: 'Clique aqui (ou em qualquer horário vazio na agenda) para registrar um novo atendimento rapidamente.',
        position: 'left',
        tab: 'agenda',
        icon: <Calendar className="text-primary" size={20} />
    },
    {
        targetId: 'tour-clients',
        title: 'Gestão de Clientes',
        description: 'Aqui você gerencia sua base de clientes e acessa o histórico completo de cada uma.',
        position: 'right',
        tab: 'clients',
        icon: <Users className="text-primary" size={20} />
    },
    {
        targetId: 'tour-add-client',
        title: 'Cadastrar Cliente',
        description: 'Use este botão para adicionar novas clientes manualmente ao sistema.',
        position: 'left',
        tab: 'clients'
    },
    {
        targetId: 'tour-admin',
        title: 'Configurações',
        description: 'Nesta seção você personaliza todo o sistema para o seu jeito.',
        position: 'right',
        tab: 'admin',
        icon: <Settings className="text-primary" size={20} />
    },
    {
        targetId: 'tour-booking-link',
        title: 'Seu Link de Agendamento',
        description: 'Este é o link que você envia para suas clientes. Elas podem agendar sozinhas sem você precisar fazer nada!',
        position: 'bottom',
        tab: 'admin',
        icon: <LinkIcon className="text-primary" size={20} />
    },
    {
        targetId: 'tour-manage-hours',
        title: 'Horário de Trabalho',
        description: 'Defina aqui o seu horário de início e fim de expediente para que a agenda fique organizada.',
        position: 'bottom',
        tab: 'admin',
        icon: <Clock className="text-primary" size={20} />
    },
    {
        targetId: 'tour-absence-mode',
        title: 'Modo Ausente',
        description: 'Vai tirar férias ou precisa bloquear um horário específico? Agende suas ausências aqui para fechar a agenda automaticamente.',
        position: 'bottom',
        tab: 'admin',
        icon: <Plane className="text-primary" size={20} />
    },
    {
        targetId: 'tour-manage-services',
        title: 'Seus Serviços',
        description: 'Cadastre, edite ou remova seus serviços, preços e durações sempre que precisar.',
        position: 'bottom',
        tab: 'admin'
    },
    {
        targetId: 'tour-finance',
        title: 'Fluxo de Caixa',
        description: 'Acompanhe seus ganhos diários, mensais e veja quem ainda tem pagamentos pendentes.',
        position: 'right',
        tab: 'finance',
        icon: <DollarSign className="text-primary" size={20} />
    }
];

interface UserTourProps {
    activeTab: string;
    onTabChange: (tab: any) => void;
}

export const UserTour: React.FC<UserTourProps> = ({ activeTab, onTabChange }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [renderTrigger, setRenderTrigger] = useState(0);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        const urlParams = new URLSearchParams(window.location.search);
        const forceTour = urlParams.get('forceTour') === 'true';

        console.log('UserTour: hasSeenTour =', hasSeenTour, 'forceTour =', forceTour);

        if (!hasSeenTour || forceTour) {
            if (forceTour) {
                localStorage.removeItem('hasSeenTour');
            }
            // Increase delay slightly to ensure everything is rendered
            console.log('UserTour: Setting 2.5s timeout for visibility...');
            const timer = setTimeout(() => {
                console.log('UserTour: Making visible now');
                setIsVisible(true);
            }, 2500);
            return () => clearTimeout(timer);
        }

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isVisible) {
            console.log('UserTour: Step', currentStep, 'update spotlight');
            const step = tourSteps[currentStep];
            if (step.tab && activeTab !== step.tab) {
                console.log('UserTour: Changing tab to', step.tab);
                onTabChange(step.tab);
                // Wait for tab transition before updating spotlight
                setTimeout(() => setRenderTrigger(prev => prev + 1), 100);
            } else {
                updateSpotlight();
            }
        }
    }, [isVisible, currentStep, activeTab, isMobile, renderTrigger]);

    const updateSpotlight = () => {
        const step = tourSteps[currentStep];
        const suffix = isMobile ? 'mobile' : 'desktop';

        // Some IDs don't have suffix (like tour-new-apt)
        let element = document.getElementById(`${step.targetId}-${suffix}`) || document.getElementById(step.targetId);
        console.log('UserTour: Target element', `${step.targetId}-${suffix}`, 'found?', !!element);

        if (element) {
            setSpotlightRect(element.getBoundingClientRect());
        } else {
            // Retry once if element not found (might be rendering)
            setTimeout(() => {
                element = document.getElementById(`${step.targetId}-${suffix}`) || document.getElementById(step.targetId);
                console.log('UserTour: Retry target element found?', !!element);
                if (element) setSpotlightRect(element.getBoundingClientRect());
            }, 200);
        }
    };

    const handleNext = () => {
        if (currentStep < tourSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenTour', 'true');
    };

    if (!isVisible || !spotlightRect) return null;

    const currentTourStep = tourSteps[currentStep];

    return (
        <div className="tour-overlay">
            <svg className="tour-mask">
                <defs>
                    <mask id="spotlight-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <motion.rect
                            initial={false}
                            animate={{
                                x: spotlightRect.left - 8,
                                y: spotlightRect.top - 8,
                                width: spotlightRect.width + 16,
                                height: spotlightRect.height + 16,
                            }}
                            rx="12"
                            fill="black"
                        />
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
            </svg>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="tour-message-box"
                    style={{
                        top: isMobile
                            ? (spotlightRect.top > window.innerHeight / 2 ? spotlightRect.top - 220 : spotlightRect.bottom + 24)
                            : Math.max(20, Math.min(window.innerHeight - 300, spotlightRect.top + (spotlightRect.height / 2) - 100)),
                        left: isMobile
                            ? '50%'
                            : (spotlightRect.right + 340 > window.innerWidth ? spotlightRect.left - 340 : spotlightRect.right + 24),
                        transform: isMobile ? 'translateX(-50%)' : 'none',
                        position: 'fixed'
                    }}
                >
                    <div className="tour-header">
                        <div className="tour-step-info">
                            Passo {currentStep + 1} de {tourSteps.length}
                        </div>
                        <button className="tour-close" onClick={handleSkip}>
                            <X size={18} />
                        </button>
                    </div>

                    <h3 className="tour-title flex items-center">
                        {currentTourStep.icon && <span className="mr-2">{currentTourStep.icon}</span>}
                        {currentTourStep.title}
                    </h3>
                    <p className="tour-description">{currentTourStep.description}</p>

                    <div className="tour-footer">
                        <button className="tour-btn-skip" onClick={handleSkip}>Pular</button>
                        <button className="tour-btn-next" onClick={handleNext}>
                            {currentStep === tourSteps.length - 1 ? 'Concluir' : 'Próximo'}
                            <ChevronRight size={18} className="ml-1" />
                        </button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
