import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import {
    Mail, Lock, Eye, EyeOff, CheckCircle2,
    ArrowRight, Loader2, Sparkles, ShieldCheck
} from 'lucide-react';
import './WelcomeOnboarding.css';

export const WelcomeOnboarding: React.FC = () => {
    const { signUp } = useAuth();
    const [step, setStep] = useState(1); // 1: Email, 2: Password
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Use the same authorized check as login
            const { data: isAuthorized, error: rpcError } = await supabase.rpc('is_email_authorized', {
                check_email: email.toLowerCase().trim()
            });

            if (rpcError) throw rpcError;

            if (isAuthorized) {
                setStep(2);
            } else {
                setError('Este e-mail ainda não está liberado em nossa base. Verifique se sua assinatura está ativa.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao validar e-mail. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleOnboarding = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await signUp(email.toLowerCase().trim(), password);
            // Redirection happens automatically via App.tsx auth listener if successful, 
            // but we can force it or show a temporary success state
            window.location.href = '/app';
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-container">
                <div className="onboarding-card reveal">
                    {/* Header */}
                    <div className="onboarding-header">
                        <div className="onboarding-logo">
                            <img src="/logo.png" alt="Agenda Pro" />
                        </div>
                        {step === 1 ? (
                            <>
                                <h1 className="onboarding-title">Boas-vindas ao <span className="highlight">Agenda Pro</span></h1>
                                <p className="onboarding-subtitle">Sua organização nunca mais vai ser a mesma. Vamos começar?</p>
                            </>
                        ) : (
                            <>
                                <h1 className="onboarding-title">Quase lá! 🚀</h1>
                                <p className="onboarding-subtitle">Como é seu primeiro acesso, vamos criar uma senha para sua segurança.</p>
                            </>
                        )}
                    </div>

                    {/* Form */}
                    <div className="onboarding-body">
                        {error && (
                            <div className="onboarding-error">
                                <ShieldCheck size={18} className="error-icon" />
                                <span>{error}</span>
                            </div>
                        )}

                        {step === 1 ? (
                            <form onSubmit={checkEmail} className="onboarding-form">
                                <div className="input-group">
                                    <label>E-mail da assinatura</label>
                                    <div className="input-wrapper">
                                        <Mail size={20} className="input-icon" />
                                        <input
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary-onboarding" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : <>Continuar <ArrowRight size={18} /></>}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleOnboarding} className="onboarding-form">
                                <div className="input-group">
                                    <label>Crie sua senha</label>
                                    <div className="input-wrapper">
                                        <Lock size={20} className="input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Mínimo 6 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="eye-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label>Confirme sua senha</label>
                                    <div className="input-wrapper">
                                        <Lock size={20} className="input-icon" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Repita a senha"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary-onboarding" disabled={loading}>
                                    {loading ? <Loader2 className="animate-spin" /> : <>Finalizar e Entrar <Sparkles size={18} /></>}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="onboarding-footer">
                        <p>© 2025 Agenda Pro. Todos os direitos reservados.</p>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
            </div>
        </div>
    );
};
