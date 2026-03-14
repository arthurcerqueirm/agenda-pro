import React, { useState, useEffect } from 'react'
import { Calendar, Clock, MessageCircle, ChevronRight, Loader2, Trophy, History, CalendarDays, Trash2, Package, Plus } from 'lucide-react'
import { format, isPast, isFuture, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { Button } from './Button'
import { Profile, ClientPackage, ClientPackageItem } from '../types/database'
import { BottomSheet } from './BottomSheet'
import { CreatePackageForm } from './CreatePackageForm'

interface ClientDetailsProps {
    client: Profile
    onClose: () => void
    onDelete?: () => void
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onClose, onDelete }) => {
    const [appointments, setAppointments] = useState<any[]>([])
    const [packages, setPackages] = useState<(ClientPackage & { items: ClientPackageItem[] })[]>([])
    const [paidAptIds, setPaidAptIds] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isCreatingPackage, setIsCreatingPackage] = useState(false)

    useEffect(() => {
        fetchHistory()
    }, [client.id])

    const fetchHistory = async () => {
        setLoading(true)
        try {
            // 1. Fetch appointments
            const { data: apts, error: aptsError } = await supabase
                .from('appointments')
                .select(`
          *,
          service:massage_id (name, price, duration_minutes)
        `)
                .eq('client_id', client.id)
                .order('start_time', { ascending: false })

            if (aptsError) throw aptsError
            setAppointments(apts || [])

            // 2. Fetch payments for these appointments
            if (apts && apts.length > 0) {
                const { data: payments, error: paymentsError } = await supabase
                    .from('payments')
                    .select('appointment_id')
                    .in('appointment_id', apts.map(a => a.id))
                    .eq('status', 'paid')

                if (paymentsError) throw paymentsError
                setPaidAptIds(new Set(payments?.map(p => p.appointment_id) || []))
            }

            // 3. Fetch Packages
            const { data: pkgs, error: pkgsError } = await supabase
                .from('client_packages')
                .select(`
                    *,
                    items:client_package_items(id, package_id, massage_id, quantity, used, massage:massages(name))
                `)
                .eq('client_id', client.id)
                .in('status', ['active', 'completed'])
                .order('created_at', { ascending: false })

            if (pkgsError) throw pkgsError
            setPackages(pkgs || [])

        } catch (err) {
            console.error('Erro ao buscar histórico:', err)
        } finally {
            setLoading(false)
        }
    }

    const confirmedPastApts = appointments.filter(apt => isPast(parseISO(apt.start_time)) && apt.status === 'confirmed')
    const upcomingApts = appointments.filter(apt => isFuture(parseISO(apt.start_time)) && apt.status === 'confirmed')

    // Identify unpaid past appointments
    const unpaidApts = confirmedPastApts.filter(apt => !paidAptIds.has(apt.id))
    const totalDebt = unpaidApts.reduce((sum, apt) => sum + (apt.service?.price || 0), 0)
    const totalPaid = confirmedPastApts.filter(apt => paidAptIds.has(apt.id)).reduce((sum, apt) => sum + (apt.service?.price || 0), 0)

    const handleWhatsApp = () => {
        const phone = client.phone?.replace(/\D/g, '')
        if (phone) {
            window.open(`https://wa.me/55${phone}`, '_blank')
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', client.id)

            if (error) throw error

            if (onDelete) onDelete()
            onClose()
        } catch (err) {
            console.error('Erro ao excluir cliente:', err)
            alert('Não foi possível excluir a cliente. Tente novamente.')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 pb-6">
            {/* Debt Warning Alert */}
            {totalDebt > 0 && (
                <div className="ios-card bg-danger/10 border-danger/20 p-5 space-y-3 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-danger-dark">
                            <History size={20} />
                            <h4 className="font-bold text-lg">Pagamentos Pendentes</h4>
                        </div>
                        <span className="text-xl font-display font-bold text-danger-dark">R$ {totalDebt}</span>
                    </div>
                    <div className="space-y-2">
                        {unpaidApts.map(apt => (
                            <div key={apt.id} className="flex items-center justify-between text-xs font-medium text-danger-dark/60">
                                <span>{apt.service?.name} ({format(parseISO(apt.start_time), "dd/MM")})</span>
                                <span className="font-bold">R$ {apt.service?.price}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-bold text-danger-dark/40 uppercase tracking-wider pt-2 border-t border-danger/10">
                        Total de {unpaidApts.length} sessões aguardando pagamento
                    </p>
                </div>
            )}

            {/* Header Stat Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="ios-card bg-primary/5 border-primary/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
                        <Trophy size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Total Realizado</span>
                    <span className="text-xl font-display font-bold text-primary">{confirmedPastApts.length}</span>
                </div>
                <div className="ios-card bg-danger/5 border-danger/10 p-4 flex flex-col items-center text-center">
                    <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center text-danger mb-2">
                        <History size={20} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-dark/30">Valor Pago</span>
                    <span className="text-xl font-display font-bold text-danger-dark">R$ {totalPaid}</span>
                </div>
            </div>

            {/* Info Card */}
            <div className="ios-card space-y-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-surface-neutral rounded-2xl flex items-center justify-center font-display font-bold text-2xl text-dark/40 uppercase shadow-inner">
                        {client.name[0]}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-dark">{client.name}</h3>
                        <p className="text-sm font-medium text-dark/40">{client.phone || 'Sem telefone'}</p>
                    </div>
                </div>

                <div className="pt-2 flex flex-col space-y-2">
                    <Button
                        variant="secondary"
                        className="w-full h-12 space-x-2 bg-primary/10 text-primary hover:bg-primary/20 border-0"
                        onClick={handleWhatsApp}
                    >
                        <MessageCircle size={20} />
                        <span>Enviar Mensagem</span>
                    </Button>
                </div>
            </div>

            {/* Packages Section */}
            {!loading && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                            <Package size={14} className="mr-2" /> Pacotes
                        </h4>
                        <button
                            id="tour-add-package"
                            onClick={() => setIsCreatingPackage(true)}
                            className="text-[10px] uppercase font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full flex items-center transition-colors"
                        >
                            <Plus size={12} className="mr-1" /> Criar
                        </button>
                    </div>

                    {packages.length > 0 ? (
                        <div className="space-y-3">
                            {packages.map(pkg => (
                                <div key={pkg.id} className={cn("ios-card !p-4 border-2 transition-all", pkg.status === 'completed' ? 'opacity-50 grayscale border-surface-neutral' : 'border-primary/20 bg-primary/5')}>
                                    <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-2">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                                                <Package size={16} />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-dark text-sm leading-tight">{pkg.name}</h5>
                                                <p className="text-[10px] text-dark/40 font-medium">Comprado {format(parseISO(pkg.created_at), "dd MMM, yyyy", { locale: ptBR })}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <span className="font-bold text-primary text-sm">R$ {pkg.total_price}</span>
                                            {pkg.status === 'completed' ? (
                                                <span className="text-[9px] uppercase font-bold text-dark/30 flex items-center bg-dark/5 px-2 py-0.5 rounded-full mt-1">
                                                    Concluído
                                                </span>
                                            ) : (
                                                <span className="text-[9px] uppercase font-bold text-primary flex items-center bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                                                    Ativo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {pkg.items?.map((item: any) => (
                                            <div key={item.id} className="flex flex-col">
                                                <div className="flex justify-between items-center text-xs font-bold mb-1">
                                                    <span className="text-dark/70">{item.massage?.name || 'Sessão'}</span>
                                                    <span className="text-primary">{item.used}/{item.quantity} USADAS</span>
                                                </div>
                                                <div className="h-2 w-full bg-dark/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500 rounded-full"
                                                        style={{ width: `${Math.min(100, (item.used / item.quantity) * 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="ios-card !p-6 border-dashed border-2 border-surface-neutral flex flex-col items-center justify-center text-center opacity-70">
                            <Package size={24} className="text-dark/20 mb-2" />
                            <p className="text-xs font-medium text-dark/40">Nenhum pacote ativo</p>
                        </div>
                    )}
                </div>
            )}

            {/* History Sections */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4 opacity-40">
                    <Loader2 className="animate-spin text-primary" size={32} />
                    <p className="font-medium text-sm">Carregando histórico...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Upcoming */}
                    {upcomingApts.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                                <CalendarDays size={14} className="mr-2" /> Próximas Sessões
                            </h4>
                            <div className="space-y-2">
                                {upcomingApts.map(apt => (
                                    <div key={apt.id} className="ios-card !p-3 flex items-center justify-between animate-in fade-in slide-in-from-right-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                                <Clock size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-dark">{apt.service?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/40">
                                                    {format(parseISO(apt.start_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-dark/20" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-dark/30 flex items-center">
                            <History size={14} className="mr-2" /> Histórico de Sessões
                        </h4>
                        {confirmedPastApts.length > 0 ? (
                            <div className="space-y-2">
                                {confirmedPastApts.map(apt => (
                                    <div key={apt.id} className={cn(
                                        "ios-card !p-3 flex items-center justify-between transition-all",
                                        paidAptIds.has(apt.id) ? "opacity-60 bg-white" : "border-danger/30 bg-danger/5"
                                    )}>
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                                paidAptIds.has(apt.id) ? "bg-surface-neutral/50 text-dark/30" : "bg-danger/10 text-danger"
                                            )}>
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className={cn(
                                                    "text-sm font-bold",
                                                    paidAptIds.has(apt.id) ? "text-dark/60" : "text-dark"
                                                )}>{apt.service?.name}</p>
                                                <p className="text-[10px] font-medium text-dark/30">
                                                    {format(parseISO(apt.start_time), "dd/MM/yyyy", { locale: ptBR })} • R$ {apt.service?.price}
                                                </p>
                                            </div>
                                        </div>
                                        {paidAptIds.has(apt.id) ? (
                                            <span className="text-[10px] font-bold text-primary">Pago</span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-danger animate-pulse">Pendente</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 border-2 border-dashed border-surface-neutral rounded-ios-lg text-center opacity-40">
                                <p className="text-xs font-medium italic">Nenhuma sessão anterior encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="pt-6 mt-6 border-t border-surface-neutral/50">
                {!showDeleteConfirm ? (
                    <Button
                        variant="ghost"
                        className="w-full text-danger hover:bg-danger/10 p-4 rounded-xl flex items-center justify-center space-x-2"
                        onClick={() => setShowDeleteConfirm(true)}
                    >
                        <Trash2 size={20} />
                        <span>Excluir Cliente</span>
                    </Button>
                ) : (
                    <div className="bg-danger/5 border border-danger/20 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-danger-dark font-medium text-center">
                            Tem certeza? Isso apagará o histórico, agendamentos e pagamentos desta cliente.
                        </p>
                        <div className="flex space-x-3">
                            <Button
                                variant="ghost"
                                className="flex-1 bg-white hover:bg-surface-neutral text-dark/60 font-medium"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 bg-danger text-white hover:bg-danger-dark font-medium"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={20} /> : 'Sim, Excluir'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={isCreatingPackage}
                onClose={() => setIsCreatingPackage(false)}
                title="Criar Novo Pacote"
            >
                <CreatePackageForm
                    client={client}
                    onCancel={() => setIsCreatingPackage(false)}
                    onSuccess={() => {
                        setIsCreatingPackage(false)
                        fetchHistory() // Recarregar painel
                    }}
                />
            </BottomSheet>
        </div>
    )
}
