import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../utils/supabase';
import {
    User,
    Clock,
    Briefcase,
    DollarSign,
    Timer,
    ArrowRight,
    Check,
    Sparkles,
    Loader2
} from 'lucide-react';
import './SetupOnboarding.css';

const steps = [
    {
        id: 'name',
        title: 'Como devemos te chamar?',
        subtitle: 'Isso ajudará seus clientes a te identificarem.',
        icon: <User className="text-teal-500" size={32} />,
    },
    {
        id: 'hours',
        title: 'Qual seu horário de trabalho?',
        subtitle: 'Sua agenda será configurada com esses limites.',
        icon: <Clock className="text-amber-500" size={32} />,
    },
    {
        id: 'service',
        title: 'Crie seu primeiro serviço',
        subtitle: 'Você poderá adicionar outros mais tarde.',
        icon: <Briefcase className="text-blue-500" size={32} />,
    }
];

export const SetupOnboarding: React.FC = () => {
    const { user, updateProfileName } = useAuth();
    const { updateSettings } = useSettings();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [startHour, setStartHour] = useState(8);
    const [endHour, setEndHour] = useState(18);
    const [serviceName, setServiceName] = useState('');
    const [servicePrice, setServicePrice] = useState('');
    const [serviceDuration, setServiceDuration] = useState('60');

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const handleFinish = async () => {
        if (!user) return;
        setLoading(true);

        try {
            // 1. Update Profile (Name) in Auth Metadata
            await updateProfileName(name);

            // 2. Update Settings (localStorage)
            updateSettings({ startHour, endHour });

            // 3. Create First Service (Table name is 'massages' in DB)
            const { error: serviceError } = await supabase
                .from('massages')
                .insert([{
                    user_id: user.id,
                    name: serviceName || 'Serviço Inicial',
                    price: parseFloat(servicePrice) || 0,
                    duration_minutes: parseInt(serviceDuration) || 60,
                    is_active: true
                }]);

            if (serviceError) throw serviceError;

            // 4. Success! Redirect
            window.location.href = '/app';
        } catch (err: any) {
            console.error('Error during setup:', err);
            // Mostrar mensagem mais específica se for erro de banco
            const message = err.message || 'Ops! Algo deu errado ao salvar suas configurações. Tente novamente.';
            alert(message);
        } finally {
            setLoading(false);
        }
    };

    const isNextDisabled = () => {
        if (currentStep === 0) return name.trim().length < 3;
        if (currentStep === 1) return endHour <= startHour;
        if (currentStep === 2) return !serviceName.trim() || !servicePrice;
        return false;
    };

    return (
        <div className="setup-page">
            <div className="setup-progress-container">
                {steps.map((_, idx) => (
                    <div
                        key={idx}
                        className={`setup-progress-bar ${idx <= currentStep ? 'active' : ''}`}
                        style={{ width: `${100 / steps.length}%` }}
                    />
                ))}
            </div>

            <main className="setup-container">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="setup-card"
                    >
                        <div className="setup-icon-wrapper">
                            {steps[currentStep].icon}
                        </div>

                        <h1 className="setup-step-title">{steps[currentStep].title}</h1>
                        <p className="setup-step-subtitle">{steps[currentStep].subtitle}</p>

                        <div className="setup-step-content">
                            {currentStep === 0 && (
                                <div className="setup-input-wrapper">
                                    <input
                                        autoFocus
                                        type="text"
                                        className="setup-huge-input"
                                        placeholder="Seu nome completo"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && !isNextDisabled() && nextStep()}
                                    />
                                    <div className="setup-input-focus-line"></div>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="setup-step-content">
                                    <div className="setup-hours">
                                        <div className="setup-hour-field">
                                            <label>Início</label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    className="setup-time-input"
                                                    value={startHour}
                                                    onChange={(e) => setStartHour(parseInt(e.target.value) || 0)}
                                                />
                                                <span className="ml-2 text-xl font-bold text-dark/30">h</span>
                                            </div>
                                        </div>
                                        <div className="setup-hour-separator">até</div>
                                        <div className="setup-hour-field">
                                            <label>Fim</label>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    className="setup-time-input"
                                                    value={endHour}
                                                    onChange={(e) => setEndHour(parseInt(e.target.value) || 0)}
                                                />
                                                <span className="ml-2 text-xl font-bold text-dark/30">h</span>
                                            </div>
                                        </div>
                                    </div>
                                    {endHour <= startHour && (
                                        <p className="mt-6 text-sm text-red-500 font-semibold animate-pulse">
                                            ⚠️ O horário de término deve ser maior que o de início.
                                        </p>
                                    )}
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="setup-service-setup">
                                    <div className="setup-input-wrapper mb-8">
                                        <input
                                            autoFocus
                                            type="text"
                                            className="setup-huge-input"
                                            placeholder="Ex: Corte de Cabelo"
                                            value={serviceName}
                                            onChange={(e) => setServiceName(e.target.value)}
                                        />
                                        <div className="setup-input-focus-line"></div>
                                        <label className="setup-input-label">Nome do serviço</label>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="setup-input-wrapper">
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-2 text-dark/40">R$</span>
                                                <input
                                                    type="number"
                                                    className="setup-huge-input"
                                                    placeholder="0,00"
                                                    value={servicePrice}
                                                    onChange={(e) => setServicePrice(e.target.value)}
                                                />
                                            </div>
                                            <div className="setup-input-focus-line"></div>
                                            <label className="setup-input-label">Preço</label>
                                        </div>
                                        <div className="setup-input-wrapper">
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    className="setup-huge-input text-right"
                                                    placeholder="60"
                                                    value={serviceDuration}
                                                    onChange={(e) => setServiceDuration(e.target.value)}
                                                />
                                                <span className="text-xl ml-2 text-dark/40">min</span>
                                            </div>
                                            <div className="setup-input-focus-line"></div>
                                            <label className="setup-input-label">Duração</label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="setup-actions">
                            <button
                                className={`setup-btn-next ${isNextDisabled() ? 'disabled' : ''}`}
                                onClick={nextStep}
                                disabled={isNextDisabled() || loading}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin" />
                                ) : (
                                    <>
                                        {currentStep === steps.length - 1 ? 'Finalizar Configuração' : 'Continuar'}
                                        {currentStep === steps.length - 1 ? <Sparkles className="ml-2" /> : <ArrowRight className="ml-2" />}
                                    </>
                                )}
                            </button>

                            {currentStep > 0 && (
                                <button className="setup-btn-back" onClick={() => setCurrentStep(prev => prev - 1)}>
                                    Voltar
                                </button>
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Background decorative elements */}
            <div className="setup-bg-elements">
                <div className="setup-blob setup-blob-1"></div>
                <div className="setup-blob setup-blob-2"></div>
                <div className="setup-circles">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`setup-circle setup-circle-${i + 1}`}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};
