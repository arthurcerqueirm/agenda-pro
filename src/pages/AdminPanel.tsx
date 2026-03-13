import React, { useState } from 'react'
import { Info, Bell, Shield, LogOut, ChevronRight, Briefcase, Calendar } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { ServiceManager } from './ServiceManager'
import { useSettings } from '../context/SettingsContext'
import { Button } from '../components/Button'

type AdminView = 'main' | 'services' | 'business-hours' | 'profile'

export const AdminPanel: React.FC = () => {
    const { signOut, connectGoogleCalendar, session, user, updateProfileName, updateUserPassword } = useAuth()
    const { settings, updateSettings } = useSettings()
    const [currentView, setCurrentView] = useState<AdminView>('main')

    const [tempStart, setTempStart] = useState(settings.startHour.toString())
    const [tempEnd, setTempEnd] = useState(settings.endHour.toString())

    const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '')
    const [newPassword, setNewPassword] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)

    const hasGoogleToken = !!session?.provider_token || !!sessionStorage.getItem('google_provider_token')

    const handleLogout = async () => {
        if (confirm('Deseja realmente sair?')) {
            await signOut()
            window.location.reload()
        }
    }

    const settingsGroups = [
        {
            title: 'Configurações do Sistema',
            items: [
                { label: 'Gestão de Serviços', icon: Briefcase, color: 'text-primary', onClick: () => setCurrentView('services') },
                {
                    label: hasGoogleToken ? 'Google Calendar Conectado' : 'Conectar Google Calendar',
                    icon: Calendar,
                    color: hasGoogleToken ? 'text-primary' : 'text-blue-500',
                    onClick: connectGoogleCalendar
                },
                { label: 'Horário de Funcionamento', icon: Shield, color: 'text-dark/60', onClick: () => setCurrentView('business-hours') },
                { label: 'Notificações Automáticas', icon: Bell, color: 'text-danger', onClick: () => { } },
            ]
        },
        {
            title: 'Sistema',
            items: [
                { label: 'Sobre o App', icon: Info, color: 'text-dark/40', onClick: () => { } },
                { label: 'Sair da Conta', icon: LogOut, color: 'text-red-400', onClick: handleLogout },
            ]
        }
    ]

    if (currentView === 'services') {
        return <ServiceManager onBack={() => setCurrentView('main')} />
    }

    if (currentView === 'business-hours') {
        return (
            <div className="space-y-6">
                <header className="flex items-center space-x-4">
                    <button
                        onClick={() => setCurrentView('main')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-display font-bold text-dark">Horários</h2>
                        <p className="text-dark/40 text-sm font-medium">Configure a grade de agendamentos</p>
                    </div>
                </header>

                <div className="ios-card space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-dark/60 uppercase">Hora de Início (0-23)</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                            className="ios-input w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-dark/60 uppercase">Hora de Fim (0-23)</label>
                        <input
                            type="number"
                            min="0"
                            max="23"
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                            className="ios-input w-full"
                        />
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                        updateSettings({
                            startHour: parseInt(tempStart) || 0,
                            endHour: parseInt(tempEnd) || 23
                        })
                        alert('Horário de funcionamento atualizado!')
                        setCurrentView('main')
                    }}
                >
                    Salvar Horários
                </Button>
            </div>
        )
    }

    if (currentView === 'profile') {
        const handleProfileSave = async () => {
            setProfileLoading(true)
            try {
                if (profileName !== user?.user_metadata?.full_name) {
                    await updateProfileName(profileName)
                }
                if (newPassword.trim().length > 0) {
                    if (newPassword.length < 6) {
                        alert('A nova senha deve ter pelo menos 6 caracteres.')
                        setProfileLoading(false)
                        return
                    }
                    await updateUserPassword(newPassword)
                }
                alert('Perfil atualizado com sucesso!')
                setNewPassword('')
                setCurrentView('main')
                window.location.reload()
            } catch (error: any) {
                alert(error.message || 'Erro ao atualizar perfil')
            } finally {
                setProfileLoading(false)
            }
        }

        return (
            <div className="space-y-6">
                <header className="flex items-center space-x-4">
                    <button
                        onClick={() => setCurrentView('main')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-display font-bold text-dark">Meu Perfil</h2>
                        <p className="text-dark/40 text-sm font-medium">Informações da sua conta</p>
                    </div>
                </header>

                <div className="ios-card space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-dark/60 uppercase">Nome de Exibição</label>
                        <input
                            type="text"
                            placeholder="Seu nome"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="ios-input w-full"
                        />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-surface-neutral/50">
                        <label className="text-xs font-bold text-dark/60 uppercase">Nova Senha de Acesso</label>
                        <input
                            type="password"
                            placeholder="Deixe em branco para não alterar"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="ios-input w-full"
                        />
                        <p className="text-[10px] text-dark/40 mt-1 pl-1">Apenas preencha se quiser mudar a sua senha atual.</p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full"
                    loading={profileLoading}
                    onClick={handleProfileSave}
                >
                    Salvar Alterações
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-display font-bold text-dark">Painel Admin</h2>
                <p className="text-dark/40 text-sm font-medium">Configurações e gestão</p>
            </header>

            {/* Profile Header */}
            <div
                className="ios-card bg-primary text-white border-none mb-8 cursor-pointer active:scale-95 transition-transform"
                onClick={() => setCurrentView('profile')}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center font-display font-bold text-2xl uppercase">
                            {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0) : 'A'}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">{user?.user_metadata?.full_name || 'Administrador'}</h3>
                            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{user?.email}</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-white/50" />
                </div>
            </div>

            {/* Settings Grid */}
            <div className="space-y-8 pb-24">
                {settingsGroups.map((group, i) => (
                    <div key={i} className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold text-dark/30 ml-2">{group.title}</h4>
                        <div className="ios-card p-0 overflow-hidden divide-y divide-surface-neutral/50">
                            {group.items.map((item, j) => (
                                <button
                                    key={j}
                                    onClick={item.onClick}
                                    className="w-full px-5 py-4 flex items-center justify-between active:bg-surface-light transition-colors group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <item.icon className={item.color} size={20} />
                                        <span className="font-bold text-dark">{item.label}</span>
                                    </div>
                                    <ChevronRight size={18} className="text-dark/10 group-active:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                <div className="px-4 py-6 flex flex-col items-center opacity-40">
                    <img src="/logo.png" alt="Agenda Pro" className="h-20 object-contain grayscale" />
                    <p className="text-center text-[9px] text-dark font-bold uppercase tracking-widest mt-2">
                        Versão 1.0.0
                    </p>
                </div>
            </div>
        </div>
    )
}
