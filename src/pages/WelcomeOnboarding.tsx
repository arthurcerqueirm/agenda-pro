import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import {
    Mail, Lock, Eye, EyeOff, CheckCircle2,
    ArrowRight, Loader2, Sparkles, ShieldCheck
} from 'lucide-react';
import './WelcomeOnboarding.css';

export const WelcomeOnboarding: React.FC = () => {
    const { signUp, sendPasswordResetEmail } = useAuth();
    const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: Reset Success
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExistingUser, setIsExistingUser] = useState(false);

    const checkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setIsExistingUser(false);

        try {
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
        const sanitizedPassword = password.trim();

        if (sanitizedPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (sanitizedPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('WelcomeOnboarding: Iniciando criação de conta...');
            const response = await signUp(email.toLowerCase().trim(), sanitizedPassword);
            console.log('WelcomeOnboarding: Resposta signUp:', response);

            if (response.data.session) {
                console.log('WelcomeOnboarding: SUCESSO - Sessão iniciada');
                window.location.href = '/app';
            } else if (response.data.user) {
                // Caso o Supabase esteja com email_confirm habilitado:
                console.log('WelcomeOnboarding: Usuário criado, aguardando confirmação ou autologin.');
                setError('Conta criada com sucesso! Verifique sua caixa de entrada para confirmar o e-mail antes de acessar.');
                setLoading(false);
            } else {
                setError('Resposta inesperada do servidor. Tente novamente.');
                setLoading(false);
            }
        } catch (err: any) {
            console.error('WelcomeOnboarding Error:', err);
            // Códigos de erro comuns do Supabase para usuário existente
            const isExisting = err.message?.includes('already registered') ||
                err.status === 400 ||
                err.code === '23505';

            if (isExisting) {
                setIsExistingUser(true);
                setError('Este e-mail já possui um registro (mesmo que parcial). Se você esqueceu a senha, utilize o link de recuperação abaixo para entrar.');
            } else {
                setError(err.message || 'Erro ao criar conta. Tente novamente.');
            }
            setLoading(false);
        }
    };

    const handleSendReset = async () => {
        setLoading(true);
        setError(null);
        try {
            await sendPasswordResetEmail(email.toLowerCase().trim());
            setStep(3); // Mostra sucesso do reset
        } catch (err: any) {
            setError(err.message || 'Erro ao enviar e-mail de recuperação.');
        } finally {
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
                        ) : step === 2 ? (
                            <>
                                <h1 className="onboarding-title">Quase lá! 🚀</h1>
                                <p className="onboarding-subtitle">Como é seu primeiro acesso, vamos criar uma senha para sua segurança.</p>
                            </>
                        ) : (
                            <>
                                <h1 className="onboarding-title">E-mail Enviado! 📬</h1>
                                <p className="onboarding-subtitle">Enviamos um link de recuperação para {email}.</p>
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

                        {step === 1 && (
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
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                {!isExistingUser ? (
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
                                ) : (
                                    <div className="space-y-4 pt-2">
                                        <button
                                            onClick={handleSendReset}
                                            className="btn-primary-onboarding bg-primary flex items-center justify-center space-x-2 w-full"
                                            disabled={loading}
                                        >
                                            {loading ? <Loader2 className="animate-spin" /> : <>Receber Link de Redefinição <ArrowRight size={18} /></>}
                                        </button>
                                        <p className="text-center text-xs text-dark/30 italic">
                                            Enviaremos um link para criar uma nova senha agora mesmo.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-6 py-4">
                                <div className="flex justify-center">
                                    <div className="w-16 h-16 bg-success/10 text-success rounded-full flex items-center justify-center">
                                        <CheckCircle2 size={32} />
                                    </div>
                                </div>
                                <p className="text-dark/60 text-sm leading-relaxed">
                                    Verifique sua caixa de entrada e clique no link para definir sua nova senha. Após isso, você poderá acessar o sistema.
                                </p>
                                <button
                                    onClick={() => window.location.href = '/app'}
                                    className="w-full h-12 border border-surface-neutral rounded-xl text-dark/40 font-bold hover:bg-surface-neutral transition-all"
                                >
                                    Ir para Tela de Login
                                </button>
                            </div>
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
