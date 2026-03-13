import React, { useState } from 'react'
import { Search, UserPlus, Phone, MoreVertical, Loader2, AlertCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '../utils/cn'
import { Button } from '../components/Button'
import { supabase } from '../utils/supabase'
import { Profile } from '../types/database'
import { BottomSheet } from '../components/BottomSheet'
import { AddClientForm } from '../components/AddClientForm'
import { ClientDetails } from '../components/ClientDetails'

const fetchClients = async () => {
    // 1. Fetch Clients
    const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name')

    if (clientsError) throw clientsError

    // 2. Fetch all past confirmed appointments
    const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
            id,
            client_id,
            status,
            start_time,
            service:massage_id (price)
        `)
        .eq('status', 'confirmed')
        .lt('start_time', new Date().toISOString())

    if (appointmentsError) throw appointmentsError

    // 3. Fetch all payments
    const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('appointment_id, status')
        .eq('status', 'paid')

    if (paymentsError) throw paymentsError

    const paidAptIds = new Set(paymentsData.map(p => p.appointment_id))

    const clientDebts: Record<string, number> = {}
    appointmentsData.forEach(apt => {
        if (!paidAptIds.has(apt.id)) {
            const price = Array.isArray(apt.service)
                ? Number(apt.service[0]?.price || 0)
                : Number((apt.service as any)?.price || 0)
            clientDebts[apt.client_id] = (clientDebts[apt.client_id] || 0) + price
        }
    })

    return (clientsData || []).map(client => ({
        ...client,
        pending_amount: clientDebts[client.id] || 0
    }))
}

export const ClientList: React.FC = () => {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<'all' | 'active' | 'debtor'>('all')
    const [isAddingClient, setIsAddingClient] = useState(false)
    const [selectedClient, setSelectedClient] = useState<Profile | null>(null)
    const [isViewingDetails, setIsViewingDetails] = useState(false)

    const { data: clients = [], isLoading, error, refetch } = useQuery({
        queryKey: ['clients'],
        queryFn: fetchClients
    })



    const handleAddSuccess = () => {
        setIsAddingClient(false)
        refetch()
    }

    const filteredClients = clients.filter((c: any) => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase())
        if (filter === 'debtor') return matchesSearch && c.pending_amount > 0
        if (filter === 'active') return matchesSearch // For now assume all are active
        return matchesSearch
    })

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark">Clientes</h2>
                    <p className="text-dark/40 text-sm font-medium">{isLoading ? 'Carregando...' : `${clients.length} no total`}</p>
                </div>
                <button
                    onClick={() => setIsAddingClient(true)}
                    className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary active:scale-95 transition-transform"
                >
                    <UserPlus size={24} />
                </button>
            </header>

            {/* Search and Filters */}
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        className="ios-input w-full pl-12"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex space-x-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {[
                        { id: 'all', label: 'Todos' },
                        { id: 'active', label: 'Ativas' },
                        { id: 'debtor', label: 'Inadimplentes' },
                    ].map((f) => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id as any)}
                            className={cn(
                                "px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                                filter === f.id ? "bg-dark text-white shadow-md shadow-dark/20" : "bg-white text-dark/40 border border-surface-neutral"
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Client Cards */}
            <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 pb-24">
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4 text-primary opacity-40">
                        <Loader2 className="animate-spin" size={32} />
                        <p className="font-medium">Buscando clientes...</p>
                    </div>
                ) : error ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 text-danger opacity-60">
                        <AlertCircle size={40} />
                        <p className="font-bold text-center">Ocorreu um erro ao carregar os clientes.<br /><span className="text-xs font-normal">Tente novamente mais tarde.</span></p>
                    </div>
                ) : filteredClients.length > 0 ? filteredClients.map((client: any) => (
                    <div
                        key={client.id}
                        className="ios-card group active:scale-[0.98] transition-all cursor-pointer"
                        onClick={() => {
                            setSelectedClient(client)
                            setIsViewingDetails(true)
                        }}
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-danger-light rounded-2xl flex items-center justify-center font-display font-bold text-xl text-danger-dark shadow-inner uppercase">
                                {client.name[0]}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-bold text-dark text-lg leading-none mb-1">{client.name}</h4>
                                        {client.pending_amount > 0 && (
                                            <div className="flex items-center bg-danger/10 text-danger-dark px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-danger rounded-full mr-1" />
                                                PENDENTE
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-2 -mr-2 text-dark/20 group-hover:text-dark/40 transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                                <div className="flex items-center text-xs text-dark/40 font-medium space-x-2">
                                    <Phone size={12} />
                                    <span>{client.phone || 'Sem telefone'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-surface-neutral/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-dark/20">Status financeiro</span>
                                <span className={cn(
                                    "text-xs font-bold",
                                    client.pending_amount > 0 ? "text-danger-dark" : "text-primary"
                                )}>
                                    {client.pending_amount > 0 ? `Deve R$ ${client.pending_amount}` : 'Em dia'}
                                </span>
                            </div>
                            <div className="flex space-x-2">
                                <Button variant="ghost" className="h-9 px-4 text-xs bg-primary/5 hover:bg-primary/10">
                                    Ver Perfil
                                </Button>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="py-20 text-center space-y-4 opacity-40">
                        <div className="w-16 h-16 bg-surface-neutral rounded-full flex items-center justify-center mx-auto">
                            <Search size={32} />
                        </div>
                        <p className="font-medium italic">Nenhuma cliente encontrada</p>
                    </div>
                )}
            </div>

            <BottomSheet
                isOpen={isAddingClient}
                onClose={() => setIsAddingClient(false)}
                title="Nova Cliente"
            >
                <AddClientForm
                    onSuccess={handleAddSuccess}
                    onCancel={() => setIsAddingClient(false)}
                />
            </BottomSheet>

            <BottomSheet
                isOpen={isViewingDetails}
                onClose={() => {
                    setIsViewingDetails(false)
                    setSelectedClient(null)
                }}
                title="Perfil da Cliente"
            >
                {selectedClient && (
                    <ClientDetails
                        client={selectedClient}
                        onClose={() => setIsViewingDetails(false)}
                        onDelete={() => {
                            setIsViewingDetails(false)
                            setSelectedClient(null)
                            refetch()
                        }}
                    />
                )}
            </BottomSheet>
        </div>
    )
}
