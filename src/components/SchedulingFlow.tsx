import React, { useState, useEffect } from 'react'
import { Search, UserPlus, CheckCircle2, Loader2, AlertCircle, Package } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../utils/cn'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { createGoogleCalendarEvent, CalendarEvent } from '../utils/googleCalendar'
import { Service, Profile, ClientPackageItem } from '../types/database'
import { format, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BottomSheet } from './BottomSheet'
import { AddClientForm } from './AddClientForm'

interface SchedulingFlowProps {
    onComplete: () => void
    preSelectedDate?: Date
}

const steps = ['Cliente', 'Serviço', 'Confirmar']

export const SchedulingFlow: React.FC<SchedulingFlowProps> = ({ onComplete, preSelectedDate }) => {
    const { session } = useAuth()
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const hasGoogleToken = !!session?.provider_token || !!sessionStorage.getItem('google_provider_token')

    const [clients, setClients] = useState<Profile[]>([])
    const [services, setServices] = useState<Service[]>([])

    const [selectedClient, setSelectedClient] = useState<Profile | null>(null)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [search, setSearch] = useState('')
    const [isAddingClient, setIsAddingClient] = useState(false)

    // Packages state
    const [clientPackageItems, setClientPackageItems] = useState<(ClientPackageItem & { package_name: string })[]>([])
    const [usePackageId, setUsePackageId] = useState<string | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoading(true)
        try {
            const [{ data: clientsData }, { data: servicesData }] = await Promise.all([
                supabase.from('clients').select('*').order('name'),
                supabase.from('massages').select('*').eq('is_active', true).order('price')
            ])

            setClients(clientsData || [])
            setServices(servicesData || [])
        } catch (err) {
            setError('Erro ao carregar dados. Verifique sua conexão.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddClientSuccess = (newClient: Profile) => {
        setClients([newClient, ...clients])
        handleClientSelect(newClient)
    }

    const handleClientSelect = async (client: Profile) => {
        setSelectedClient(client)
        setStep(1)

        // Load active packages for this client
        try {
            const { data, error } = await supabase
                .from('client_packages')
                .select(`
                    id, name, status,
                    items:client_package_items(id, massage_id, quantity, used)
                `)
                .eq('client_id', client.id)
                .in('status', ['active'])

            if (!error && data) {
                const availableItems: any[] = []
                data.forEach(pkg => {
                    pkg.items.forEach((item: any) => {
                        if (item.used < item.quantity) {
                            availableItems.push({
                                ...item,
                                package_name: pkg.name
                            })
                        }
                    })
                })
                setClientPackageItems(availableItems)
            }
        } catch (err) {
            console.error('Erro ao buscar pacotes do cliente', err)
        }
    }

    const handleConfirm = async () => {
        if (!selectedClient || !selectedService) return

        setLoading(true)
        setError(null)

        try {
            const startTime = preSelectedDate || new Date()
            const endTime = addMinutes(startTime, selectedService.duration_minutes)

            console.log('Agendando para:', format(startTime, 'yyyy-MM-dd HH:mm'))

            // 1. Save to Supabase
            const { data: appointment, error: dbError } = await supabase
                .from('appointments')
                .insert({
                    client_id: selectedClient.id,
                    massage_id: selectedService.id,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    status: 'confirmed'
                })
                .select()
                .single()

            if (dbError) throw dbError

            // IF using package, update the package item and create a "paid" record
            if (usePackageId) {
                const item = clientPackageItems.find(i => i.id === usePackageId)
                if (item) {
                    await supabase
                        .from('client_package_items')
                        .update({ used: item.used + 1 })
                        .eq('id', item.id)

                    // Also check if package is completed
                    const { data: siblingItems } = await supabase
                        .from('client_package_items')
                        .select('id, quantity, used')
                        .eq('package_id', item.package_id)

                    const isAllUsed = siblingItems?.every(si =>
                        (si.id === item.id ? si.used + 1 : si.used) >= si.quantity
                    )

                    if (isAllUsed) {
                        await supabase
                            .from('client_packages')
                            .update({ status: 'completed' })
                            .eq('id', item.package_id)
                    }

                    // Register payment as zero-cost bundle usage
                    await supabase.from('payments').insert({
                        appointment_id: appointment.id,
                        amount: 0,
                        method: 'pix', // arbitrary
                        status: 'paid',
                        payment_date: new Date().toISOString()
                    })
                }
            }

            // 2. Sync with Google Calendar (se conectado)
            if (hasGoogleToken) {
                try {
                    const googleEvent: CalendarEvent = {
                        summary: `Sessão: ${selectedService.name} - ${selectedClient.name}`,
                        description: `Agendamento via Sistema\nServiço: ${selectedService.name}\nCliente: ${selectedClient.name}`,
                        start: {
                            dateTime: startTime.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: endTime.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        }
                    }

                    // Tentar obter token atualizado da session ou sessionStorage
                    const token = session?.provider_token || sessionStorage.getItem('google_provider_token')

                    if (token) {
                        const syncResult = await createGoogleCalendarEvent(token, googleEvent)

                        if (syncResult?.id) {
                            await supabase
                                .from('appointments')
                                .update({ google_event_id: syncResult.id })
                                .eq('id', appointment.id)
                        }
                    }
                } catch (googleErr) {
                    console.error('Falha na sincronização com Google Calendar:', googleErr)
                    // Não travamos o app, o agendamento já está no banco de dados.
                }
            }

            onComplete()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao realizar o agendamento.')
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="flex justify-between items-center mb-8 px-2">
                {steps.map((s, i) => (
                    <React.Fragment key={s}>
                        <div className="flex flex-col items-center">
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300",
                                step >= i ? "bg-primary text-white" : "bg-surface-neutral text-dark/30"
                            )}>
                                {step > i ? <CheckCircle2 size={16} /> : i + 1}
                            </div>
                            <span className={cn(
                                "text-[10px] mt-1 font-bold uppercase tracking-wider",
                                step >= i ? "text-primary" : "text-dark/20"
                            )}>{s}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={cn("h-[2px] flex-1 mx-2 mt-[-16px]", step > i ? "bg-primary" : "bg-surface-neutral")} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 p-4 rounded-ios-lg flex items-center space-x-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {/* Step Content */}
            <div className="min-h-[300px]">
                {loading && step === 0 ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : (
                    <>
                        {step === 0 && (
                            <div className="space-y-4 fade-in">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        className="ios-input w-full pl-12"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                                    {filteredClients.map(client => (
                                        <button
                                            key={client.id}
                                            onClick={() => handleClientSelect(client)}
                                            className={cn(
                                                "w-full p-4 flex items-center justify-between rounded-2xl transition-all",
                                                selectedClient?.id === client.id ? "bg-primary/10 border-primary" : "bg-surface-light hover:bg-surface-neutral/30"
                                            )}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-danger-light rounded-full flex items-center justify-center font-bold text-danger-dark uppercase">
                                                    {client.name[0]}
                                                </div>
                                                <span className="font-semibold text-dark text-left">{client.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                    {filteredClients.length === 0 && (
                                        <div className="text-center py-4 text-dark/20 italic font-medium">Nenhum cliente encontrado</div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full text-primary border-2 border-primary border-dashed h-14"
                                    onClick={() => setIsAddingClient(true)}
                                >
                                    <UserPlus size={20} className="mr-2" /> Nova Cliente
                                </Button>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="grid grid-cols-1 gap-4 fade-in">
                                {services.map(s => {
                                    const availablePkg = clientPackageItems.find(c => c.massage_id === s.id)
                                    return (
                                        <button
                                            key={s.id}
                                            onClick={() => {
                                                setSelectedService(s)
                                                setUsePackageId(availablePkg ? availablePkg.id : null)
                                                setStep(2)
                                            }}
                                            className={cn(
                                                "p-5 rounded-ios-lg text-left transition-all border-2",
                                                selectedService?.id === s.id ? "bg-primary/10 border-primary" : "bg-surface-light border-transparent relative overflow-hidden"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-bold text-dark">{s.name}</h4>
                                                <span className="font-display font-bold text-primary">R$ {s.price}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-dark/40 font-medium">Duração: {s.duration_minutes} min</p>
                                                {availablePkg && (
                                                    <span className="text-[10px] font-bold text-white bg-primary px-3 py-1 rounded-full flex items-center shadow-md animate-pulse">
                                                        <Package size={12} className="mr-1" />
                                                        Disponível no Pacote ({availablePkg.quantity - availablePkg.used} restam)
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 fade-in">
                                <div className="bg-surface-light p-6 rounded-ios-lg border-2 border-primary/20 space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Cliente</span>
                                        <span className="font-bold text-dark">{selectedClient?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Serviço</span>
                                        <span className="font-bold text-dark">{selectedService?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-dark/40 font-bold uppercase text-[10px]">Horário</span>
                                        <span className="font-bold text-dark">
                                            {format(preSelectedDate || new Date(), "eeee, HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>

                                    {usePackageId && (
                                        <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between mt-4">
                                            <div className="flex items-center text-primary">
                                                <Package size={16} className="mr-2" />
                                                <span className="text-sm font-bold">Ativar Pacote</span>
                                            </div>
                                            <span className="text-xs font-bold text-primary/60 uppercase">Dedução Automática</span>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-surface-neutral flex justify-between items-center">
                                        <span className="font-display font-bold xl text-dark">Total</span>
                                        {usePackageId ? (
                                            <div className="text-right">
                                                <span className="text-sm font-display font-bold text-dark/30 line-through mr-2">R$ {selectedService?.price}</span>
                                                <span className="text-2xl font-display font-bold text-primary">R$ 0.00</span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl font-display font-bold text-primary">R$ {selectedService?.price}</span>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    className="w-full h-16 text-lg"
                                    onClick={handleConfirm}
                                    loading={loading}
                                >
                                    Confirmar Agendamento
                                </Button>
                                {hasGoogleToken ? (
                                    <p className="text-center text-[10px] uppercase font-bold text-dark/20 px-8">
                                        O agendamento será sincronizado com seu Google Calendar
                                    </p>
                                ) : (
                                    <p className="text-center text-[10px] uppercase font-bold text-dark/20 px-8">
                                        Agendamento salvo apenas no banco de dados local
                                    </p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <BottomSheet
                isOpen={isAddingClient}
                onClose={() => setIsAddingClient(false)}
                title="Nova Cliente"
            >
                <AddClientForm
                    onSuccess={handleAddClientSuccess}
                    onCancel={() => setIsAddingClient(false)}
                />
            </BottomSheet>
        </div>
    )
}
