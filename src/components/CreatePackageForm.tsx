import React, { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Button } from './Button'
import { Loader2, Plus, Minus, Trash2, Package } from 'lucide-react'
import { Service, Profile } from '../types/database'

interface CreatePackageFormProps {
    client: Profile
    onSuccess: () => void
    onCancel: () => void
}

export const CreatePackageForm: React.FC<CreatePackageFormProps> = ({ client, onSuccess, onCancel }) => {
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [packageName, setPackageName] = useState('')
    const [totalPrice, setTotalPrice] = useState<string>('')

    // Items no carrinho do pacote
    const [selectedItems, setSelectedItems] = useState<{ serviceId: string, quantity: number }[]>([])

    useEffect(() => {
        fetchServices()
    }, [])

    const fetchServices = async () => {
        try {
            const { data, error } = await supabase
                .from('massages')
                .select('*')
                .eq('is_active', true)
                .order('name')
            if (error) throw error
            setServices(data || [])
        } catch (err) {
            console.error('Erro ao buscar serviços:', err)
        } finally {
            setLoading(false)
        }
    }

    const addItem = (serviceId: string) => {
        const existing = selectedItems.find(i => i.serviceId === serviceId)
        if (existing) {
            setSelectedItems(selectedItems.map(i => i.serviceId === serviceId ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setSelectedItems([...selectedItems, { serviceId, quantity: 1 }])
        }
    }

    const removeItem = (serviceId: string) => {
        const existing = selectedItems.find(i => i.serviceId === serviceId)
        if (existing && existing.quantity > 1) {
            setSelectedItems(selectedItems.map(i => i.serviceId === serviceId ? { ...i, quantity: i.quantity - 1 } : i))
        } else {
            setSelectedItems(selectedItems.filter(i => i.serviceId !== serviceId))
        }
    }

    const suggestedPrice = selectedItems.reduce((acc, item) => {
        const service = services.find(s => s.id === item.serviceId)
        return acc + (service ? Number(service.price) * item.quantity : 0)
    }, 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedItems.length === 0) {
            alert('Adicione pelo menos um serviço ao pacote.')
            return
        }
        if (!totalPrice || Number(totalPrice) < 0) {
            alert('Informe um valor válido para o pacote.')
            return
        }

        setSubmitting(true)
        try {
            // 1. Criar Pacote
            const { data: pkgData, error: pkgError } = await supabase
                .from('client_packages')
                .insert([{
                    client_id: client.id,
                    name: packageName || 'Pacote Especial',
                    total_price: Number(totalPrice),
                    status: 'active'
                }])
                .select()
                .single()

            if (pkgError) throw pkgError

            // 2. Criar Itens do Pacote
            const itemsToInsert = selectedItems.map(item => ({
                package_id: pkgData.id,
                massage_id: item.serviceId,
                quantity: item.quantity,
                used: 0
            }))

            const { error: itemsError } = await supabase
                .from('client_package_items')
                .insert(itemsToInsert)

            if (itemsError) throw itemsError

            // 3. Opcional: Já lançar como pago no banco de dados para evitar inadimplências,
            // ou assumir que o sistema futuro aceita gerenciar parcelamentos/pagamentos via PIX aqui.
            // Por simplicidade: não vamos criar Appointment ainda. O pacote em si é um "crédito".

            onSuccess()
        } catch (err) {
            console.error('Erro ao salvar pacote:', err)
            alert('Não foi possível salvar o pacote. Verifique se as tabelas de pacotes foram criadas.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="py-12 flex justify-center text-primary">
                <Loader2 className="animate-spin" />
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            <div className="space-y-4">
                {/* Nome e Valor */}
                <div className="space-y-3">
                    <label className="text-sm font-bold text-dark/60 ml-2">Nome do Pacote (Opcional)</label>
                    <input
                        type="text"
                        placeholder="Ex: Pacote 10 Sessões Drenagem"
                        className="ios-input w-full"
                        value={packageName}
                        onChange={(e) => setPackageName(e.target.value)}
                    />
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-bold text-dark/60 ml-2">Serviços Inclusos</label>
                    <div className="ios-card bg-surface-neutral/20 border-surface-neutral space-y-2 !p-3">
                        {services.map(service => {
                            const selected = selectedItems.find(i => i.serviceId === service.id)
                            return (
                                <div key={service.id} className="flex items-center justify-between p-2 bg-white rounded-xl shadow-sm">
                                    <div className="flex-1">
                                        <p className="font-bold text-sm text-dark">{service.name}</p>
                                        <p className="text-[10px] font-medium text-dark/40">R$ {service.price}</p>
                                    </div>
                                    <div className="flex items-center space-x-3 bg-surface-light rounded-lg p-1">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(service.id)}
                                            disabled={!selected}
                                            className="w-8 h-8 flex items-center justify-center text-dark/40 disabled:opacity-20 hover:text-danger hover:bg-danger/10 rounded-md transition-colors"
                                        >
                                            <Minus size={16} />
                                        </button>
                                        <span className="w-4 text-center font-bold text-dark text-sm">
                                            {selected ? selected.quantity : 0}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => addItem(service.id)}
                                            className="w-8 h-8 flex items-center justify-center text-primary hover:bg-primary/10 rounded-md transition-colors"
                                        >
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="ios-card bg-primary/5 border-primary/20 p-4 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-dark/60">Valor Original Total:</span>
                        <span className="font-display font-medium text-dark/40 line-through">
                            R$ {suggestedPrice.toFixed(2)}
                        </span>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-primary ml-1 flex items-center">
                            <Package size={16} className="mr-2" /> Valor do Pacote com Desconto
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/40 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                min="0"
                                placeholder={suggestedPrice.toFixed(2)}
                                className="ios-input w-full pl-12 font-bold text-lg text-primary transition-colors focus:bg-white"
                                value={totalPrice}
                                onChange={(e) => setTotalPrice(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex space-x-3 pt-4">
                <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={submitting}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={submitting || selectedItems.length === 0}
                >
                    {submitting ? <Loader2 className="animate-spin" /> : 'Criar Pacote'}
                </Button>
            </div>
        </form>
    )
}
