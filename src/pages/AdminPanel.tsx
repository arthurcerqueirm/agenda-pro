import React, { useState } from 'react'
import { Info, Bell, BellOff, Shield, LogOut, ChevronRight, Briefcase, Calendar, Check, Link as LinkIcon, Share2, Plus, Plane, Trash2, Clock, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useAuth } from '../context/AuthContext'
import { ServiceManager } from './ServiceManager'
import { useSettings } from '../context/SettingsContext'
import { ConfirmModal } from '../components/ConfirmModal'
import { Button } from '../components/Button'
import { SuperAdminDashboard } from './SuperAdmin/SuperAdminDashboard'
import { cn } from '../utils/cn'

type AdminView = 'main' | 'services' | 'business-hours' | 'absence' | 'profile' | 'super-admin'

export const AdminPanel: React.FC = () => {
    const { signOut, connectGoogleCalendar, session, user, updateProfileName, updateUserPassword, isAdmin } = useAuth()
    const { settings, updateSettings } = useSettings()
    const [currentView, setCurrentView] = useState<AdminView>('main')

    const [tempStart, setTempStart] = useState(settings.startHour.toString())
    const [tempEnd, setTempEnd] = useState(settings.endHour.toString())
    const [tempWorkingDays, setTempWorkingDays] = useState<number[]>(settings.workingDays)
    const [tempCustomHours, setTempCustomHours] = useState<Record<number, { start: number, end: number }>>(settings.customHours)
    const [tempAbsences, setTempAbsences] = useState(settings.absences.filter(a => new Date(a.end) > new Date()))
    const [newAbsence, setNewAbsence] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        startHour: '08',
        endDate: format(new Date(), 'yyyy-MM-dd'),
        endHour: '18',
        reason: ''
    })

    const [profileName, setProfileName] = useState(user?.user_metadata?.full_name || '')
    const [newPassword, setNewPassword] = useState('')
    const [profileLoading, setProfileLoading] = useState(false)
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
    const [copySuccess, setCopySuccess] = useState(false)

    const bookingUrl = `${window.location.origin}/b/${user?.id}`
    const hasGoogleToken = !!session?.provider_token || !!sessionStorage.getItem('google_provider_token')

    const handleCopyLink = () => {
        navigator.clipboard.writeText(bookingUrl)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
    }

    const handleLogout = async () => {
        setIsLogoutConfirmOpen(true)
    }

    const confirmLogout = async () => {
        await signOut()
        window.location.reload()
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
                { label: 'Modo Ausente', icon: Plane, color: 'text-orange-500', onClick: () => setCurrentView('absence') },
            ]
        },
        {
            title: 'Ajuda e Suporte',
            items: [
                {
                    label: 'Reiniciar Tour Interativo',
                    icon: Sparkles,
                    color: 'text-yellow-500',
                    onClick: () => {
                        localStorage.removeItem('hasSeenTour');
                        window.location.reload();
                    }
                },
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

    if (isAdmin) {
        settingsGroups.splice(1, 0, {
            title: 'Ações de Desenvolvedor',
            items: [
                { label: 'Backoffice Global', icon: Shield, color: 'text-danger-dark', onClick: () => setCurrentView('super-admin') },
            ]
        })
    }

    if (currentView === 'super-admin') {
        return <SuperAdminDashboard onLogout={() => setCurrentView('main')} />
    }

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

                <div className="ios-card space-y-4">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-dark/60 uppercase">Dias de Atendimento</label>
                        <div className="flex justify-between gap-1">
                            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => {
                                const isActive = tempWorkingDays.includes(index);
                                return (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (isActive) {
                                                setTempWorkingDays(tempWorkingDays.filter(d => d !== index));
                                            } else {
                                                setTempWorkingDays([...tempWorkingDays, index].sort());
                                            }
                                        }}
                                        className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all border",
                                            isActive
                                                ? "bg-primary text-white border-primary shadow-sm"
                                                : "bg-surface-light text-dark/30 border-surface-neutral/50"
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-[10px] text-dark/30 italic">Selecione os dias da semana em que você realiza atendimentos.</p>
                    </div>
                </div>

                <div className="ios-card space-y-4">
                    <label className="text-xs font-bold text-dark/60 uppercase">Personalizar Horários por Dia</label>
                    <div className="space-y-3">
                        {tempWorkingDays.map(dayIndex => {
                            const custom = tempCustomHours[dayIndex];
                            const dayName = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][dayIndex];

                            return (
                                <div key={dayIndex} className="p-4 bg-surface-light rounded-2xl border border-surface-neutral/30 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-dark">{dayName}</span>
                                        <button
                                            onClick={() => {
                                                if (custom) {
                                                    const newCustom = { ...tempCustomHours };
                                                    delete newCustom[dayIndex];
                                                    setTempCustomHours(newCustom);
                                                } else {
                                                    setTempCustomHours({
                                                        ...tempCustomHours,
                                                        [dayIndex]: { start: parseInt(tempStart) || 8, end: parseInt(tempEnd) || 18 }
                                                    });
                                                }
                                            }}
                                            className={cn(
                                                "text-[10px] font-bold uppercase px-3 py-1 rounded-full transition-all",
                                                custom ? "bg-primary/10 text-primary" : "bg-dark/5 text-dark/40"
                                            )}
                                        >
                                            {custom ? 'Personalizado' : 'Horário Padrão'}
                                        </button>
                                    </div>

                                    {custom && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-dark/40 uppercase">Início</label>
                                                <input
                                                    type="number"
                                                    value={custom.start}
                                                    onChange={(e) => setTempCustomHours({
                                                        ...tempCustomHours,
                                                        [dayIndex]: { ...custom, start: parseInt(e.target.value) || 0 }
                                                    })}
                                                    className="ios-input py-2 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[9px] font-bold text-dark/40 uppercase">Fim</label>
                                                <input
                                                    type="number"
                                                    value={custom.end}
                                                    onChange={(e) => setTempCustomHours({
                                                        ...tempCustomHours,
                                                        [dayIndex]: { ...custom, end: parseInt(e.target.value) || 0 }
                                                    })}
                                                    className="ios-input py-2 text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {tempWorkingDays.length === 0 && (
                            <p className="text-center text-xs text-dark/30 italic py-4">Ative alguns dias de atendimento para personalizar os horários.</p>
                        )}
                    </div>
                </div>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                        updateSettings({
                            startHour: parseInt(tempStart) || 0,
                            endHour: parseInt(tempEnd) || 23,
                            workingDays: tempWorkingDays,
                            customHours: tempCustomHours,
                            absences: tempAbsences
                        })
                        alert('Configurações de funcionamento atualizadas!')
                        setCurrentView('main')
                    }}
                >
                    Salvar Configurações
                </Button>
            </div>
        )
    }

    if (currentView === 'absence') {
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
                        <h2 className="text-2xl font-display font-bold text-dark">Modo Ausente</h2>
                        <p className="text-dark/40 text-sm font-medium">Gerencie suas folgas e ausências</p>
                    </div>
                </header>

                <div className="ios-card space-y-4">
                    <div className="flex items-center space-x-2">
                        <Plane size={18} className="text-primary" />
                        <label className="text-xs font-bold text-dark/60 uppercase">Adicionar Nova Ausência</label>
                    </div>

                    <div className="space-y-6 bg-surface-light p-5 rounded-[2.5rem] border border-surface-neutral/30 shadow-inner">
                        <div className="space-y-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-dark/40 uppercase tracking-widest pl-1">Início da Ausência</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={16} />
                                        <input
                                            type="date"
                                            value={newAbsence.startDate}
                                            onChange={(e) => setNewAbsence({ ...newAbsence, startDate: e.target.value })}
                                            className="ios-input pl-11 py-3 text-xs w-full bg-white border-none shadow-sm font-bold"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={16} />
                                        <select
                                            value={newAbsence.startHour}
                                            onChange={(e) => setNewAbsence({ ...newAbsence, startHour: e.target.value })}
                                            className="ios-input pl-11 py-3 text-xs w-full bg-white border-none shadow-sm font-bold appearance-none"
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => {
                                                const h = i.toString().padStart(2, '0')
                                                return <option key={h} value={h}>{h}:00</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-dark/40 uppercase tracking-widest pl-1">Fim da Ausência</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={16} />
                                        <input
                                            type="date"
                                            value={newAbsence.endDate}
                                            onChange={(e) => setNewAbsence({ ...newAbsence, endDate: e.target.value })}
                                            className="ios-input pl-11 py-3 text-xs w-full bg-white border-none shadow-sm font-bold"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40" size={16} />
                                        <select
                                            value={newAbsence.endHour}
                                            onChange={(e) => setNewAbsence({ ...newAbsence, endHour: e.target.value })}
                                            className="ios-input pl-11 py-3 text-xs w-full bg-white border-none shadow-sm font-bold appearance-none"
                                        >
                                            {Array.from({ length: 24 }).map((_, i) => {
                                                const h = i.toString().padStart(2, '0')
                                                return <option key={h} value={h}>{h}:00</option>
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                className="w-full text-xs font-bold py-4 h-auto shadow-ios mt-4 bg-gradient-to-r from-primary to-primary-dark rounded-2xl"
                                onClick={() => {
                                    const startStr = `${newAbsence.startDate}T${newAbsence.startHour}:00:00`
                                    const endStr = `${newAbsence.endDate}T${newAbsence.endHour}:00:00`

                                    const startDate = new Date(startStr)
                                    const endDate = new Date(endStr)

                                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return alert('Selecione datas válidas.')
                                    if (startDate >= endDate) return alert('O fim deve ser posterior ao início.')

                                    const id = Math.random().toString(36).substr(2, 9)
                                    const updatedAbsences = [...tempAbsences, { id, start: startStr, end: endStr }].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

                                    setTempAbsences(updatedAbsences)
                                    updateSettings({ absences: updatedAbsences })
                                    setNewAbsence({ ...newAbsence, reason: '' })
                                    alert('Folga agendada com sucesso! ✈️')
                                }}
                            >
                                <Plus size={18} className="mr-2" /> Agendar Ausência
                            </Button>
                        </div>
                    </div>
                </div>

                {tempAbsences.length > 0 && (
                    <div className="space-y-4">
                        <label className="text-[11px] font-bold text-dark/30 uppercase tracking-[0.2em] px-5">Agenda de Ausências</label>
                        <div className="space-y-3 px-1">
                            {tempAbsences.map(absence => (
                                <div key={absence.id} className="ios-card group flex items-center justify-between p-5 bg-white shadow-ios border-none hover:bg-surface-light transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                                            <Plane size={24} />
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-bold text-dark">
                                                    {format(new Date(absence.start), "dd 'de' MMM", { locale: ptBR })}
                                                </span>
                                                <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-tighter">
                                                    {format(new Date(absence.start), 'HH:mm')}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1 mt-0.5 opacity-40">
                                                <ChevronRight size={10} className="text-dark" />
                                                <span className="text-[10px] text-dark font-medium">
                                                    Até {format(new Date(absence.end), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const updated = tempAbsences.filter(a => a.id !== absence.id)
                                            setTempAbsences(updated)
                                            updateSettings({ absences: updated })
                                        }}
                                        className="w-12 h-12 rounded-[1.2rem] bg-red-50 flex items-center justify-center text-red-500 active:scale-90 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {tempAbsences.length === 0 && (
                    <div className="ios-card bg-surface-light border-dashed border-surface-neutral/50 p-10 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-dark/10">
                            <Plane size={32} />
                        </div>
                        <p className="text-xs text-dark/40 font-medium leading-relaxed">
                            Você não tem ausências programadas.<br />Adicione uma acima se precisar bloquear sua agenda.
                        </p>
                    </div>
                )}
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

            {/* Booking Link Card */}
            <div id="tour-booking-link" className="ios-card bg-white border-primary/20 border-2 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <LinkIcon size={18} className="text-primary" />
                        <h4 className="text-sm font-bold text-dark">Link de Agendamento Online</h4>
                    </div>
                    {copySuccess && (
                        <span className="text-[10px] font-bold text-success-dark animate-in fade-in zoom-in">Copiado!</span>
                    )}
                </div>
                <div className="flex items-center space-x-2 bg-surface-light p-3 rounded-xl border border-surface-neutral-300">
                    <input
                        type="text"
                        readOnly
                        value={bookingUrl}
                        className="bg-transparent text-[10px] font-mono text-dark/60 flex-1 truncate outline-none"
                    />
                    <button
                        onClick={handleCopyLink}
                        className="bg-primary text-white p-2 rounded-lg active:scale-95 transition-transform"
                    >
                        {copySuccess ? <Check size={16} /> : <Share2 size={16} />}
                    </button>
                </div>
                <p className="mt-3 text-[10px] text-dark/30 font-medium">Compartilhe este link com seus clientes para que eles agendem direto pelo navegador.</p>
            </div>

            {/* Notifications Card */}
            <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold text-dark/30 ml-2">Notificações</h4>
                <div className="ios-card space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {settings.notificationsEnabled
                                ? <Bell className="text-primary" size={20} />
                                : <BellOff className="text-dark/30" size={20} />}
                            <div>
                                <p className="font-bold text-dark text-sm">Lembrete de Agendamento</p>
                                <p className="text-[10px] text-dark/40 font-medium">Receba um aviso antes do horário</p>
                            </div>
                        </div>
                        {/* Toggle Switch */}
                        <button
                            onClick={async () => {
                                if (!settings.notificationsEnabled) {
                                    if (!('Notification' in window)) {
                                        alert('Seu navegador não suporta notificações.')
                                        return
                                    }
                                    const perm = await Notification.requestPermission()
                                    if (perm !== 'granted') {
                                        alert('Permissão negada. Habilite notificações nas configurações do seu navegador/celular.')
                                        return
                                    }
                                }
                                updateSettings({ notificationsEnabled: !settings.notificationsEnabled })
                            }}
                            className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${settings.notificationsEnabled ? 'bg-primary' : 'bg-dark/20'
                                }`}
                        >
                            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                                }`} />
                        </button>
                    </div>

                    {settings.notificationsEnabled && (
                        <div className="pt-3 border-t border-surface-neutral/50 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-dark/60 uppercase">Avisar quantos minutos antes?</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[10, 15, 30, 60].map((min) => (
                                        <button
                                            key={min}
                                            onClick={() => updateSettings({ notifyMinutesBefore: min })}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${settings.notifyMinutesBefore === min
                                                ? 'bg-primary text-white shadow-ios'
                                                : 'bg-surface-light text-dark/50 border border-surface-neutral'
                                                }`}
                                        >
                                            {min === 60 ? '1 hora' : `${min} min`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Test Button */}
                            <button
                                onClick={async () => {
                                    if (Notification.permission !== 'granted') {
                                        alert('Permissão de notificação não concedida.')
                                        return
                                    }
                                    const sendTest = () => {
                                        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                                            navigator.serviceWorker.controller.postMessage({
                                                type: 'SHOW_NOTIFICATION',
                                                title: '⏰ Agendamento em 30 minutos',
                                                body: 'Maria Silva • Massagem Relaxante',
                                                icon: '/logo-celular.png',
                                            })
                                        } else {
                                            new Notification('⏰ Agendamento em 30 minutos', {
                                                body: 'Maria Silva • Massagem Relaxante',
                                                icon: '/logo-celular.png',
                                            })
                                        }
                                    }
                                    sendTest()
                                }}
                                className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm active:scale-95 transition-transform border border-primary/20"
                            >
                                <Bell size={16} />
                                <span>Ver exemplo de notificação</span>
                            </button>
                        </div>
                    )}
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
                                    id={item.label === 'Gestão de Serviços' ? 'tour-manage-services' : item.label === 'Horário de Funcionamento' ? 'tour-manage-hours' : item.label === 'Modo Ausente' ? 'tour-absence-mode' : undefined}
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

            <ConfirmModal
                isOpen={isLogoutConfirmOpen}
                title="Sair da conta?"
                message="Tem certeza que deseja encerrar sua sessão atual?"
                confirmLabel="Sair"
                cancelLabel="Cancelar"
                variant="danger"
                onConfirm={confirmLogout}
                onCancel={() => setIsLogoutConfirmOpen(false)}
            />
        </div>
    )
}
