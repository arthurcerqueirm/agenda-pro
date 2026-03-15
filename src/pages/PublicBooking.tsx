import React, { useState, useEffect } from 'react'
import { Calendar, Clock, ChevronRight, CheckCircle2, Loader2, AlertCircle, User, Phone, Briefcase } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { Service, Appointment } from '../types/database'
import { format, addMinutes, startOfDay, endOfDay, eachHourOfInterval, setHours, setMinutes, isSameDay, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { Button } from '../components/Button'

interface PublicBookingProps {
    userId: string
}

export const PublicBooking: React.FC<PublicBookingProps> = ({ userId }) => {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Data from professional
    const [professional, setProfessional] = useState<{ full_name?: string, start_hour?: number, end_hour?: number, working_days?: number[], custom_hours?: Record<number, { start: number, end: number }>, absences?: { id: string, start: string, end: string }[] } | null>(null)
    const [services, setServices] = useState<Service[]>([])
    const [appointments, setAppointments] = useState<Partial<Appointment>[]>([])

    // Selection state
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [clientName, setClientName] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Mask for phone: (XX) XXXXX-XXXX
    const maskPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        if (numbers.length <= 2) return numbers
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }

    const [success, setSuccess] = useState(false)
    const lockRef = React.useRef(false)

    useEffect(() => {
        fetchProfessionalData()
    }, [userId])

    const fetchProfessionalData = async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Fetch professional info from settings
            const [settingsRes, servicesRes, appointmentsRes] = await Promise.all([
                supabase.from('profiles_settings').select('full_name, start_hour, end_hour, working_days, custom_hours, absences').eq('user_id', userId).single(),
                supabase.from('massages').select('*').eq('user_id', userId).eq('is_active', true),
                supabase.from('appointments').select('start_time, end_time').eq('user_id', userId).gte('start_time', startOfDay(new Date()).toISOString())
            ])

            if (settingsRes.data) {
                setProfessional(settingsRes.data)
            }

            setServices(servicesRes.data || [])
            setAppointments(appointmentsRes.data || [])

        } catch (err: any) {
            console.error('PublicBooking Fetch Error:', err)
            setError(`Erro ao carregar dados.`)
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => setStep(prev => prev + 1)
    const prevStep = () => setStep(prev => prev - 1)

    const handleBooking = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()

        // Synchronous check using Ref to prevent fast double-clicks
        if (!selectedService || !selectedTime || !clientName || !clientPhone || isSubmitting || lockRef.current) return

        lockRef.current = true
        setIsSubmitting(true)
        setError(null)

        try {
            const [hours, minutes] = selectedTime.split(':').map(Number)
            // Clear seconds and milliseconds to avoid precision issues in CalendarView
            const startTime = new Date(selectedDate)
            startTime.setHours(hours, minutes, 0, 0)
            const endTime = addMinutes(startTime, selectedService.duration_minutes)

            // 1. Check if client already exists (by phone for this professional)
            let clientId: string

            const { data: existingClient } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', userId)
                .eq('phone', clientPhone)
                .maybeSingle()

            if (existingClient) {
                clientId = existingClient.id
            } else {
                // Create new client
                const { data: newClient, error: clientError } = await supabase
                    .from('clients')
                    .insert([{
                        user_id: userId,
                        name: clientName,
                        phone: clientPhone
                    }])
                    .select()
                    .single()

                if (clientError) throw clientError
                clientId = newClient.id
            }

            // 2. Double check availability right before insert (Final Guard)
            const startTimeIso = startTime.toISOString()
            const { data: conflict } = await supabase
                .from('appointments')
                .select('id')
                .eq('user_id', userId)
                .eq('start_time', startTimeIso)
                .maybeSingle()

            if (conflict) {
                throw new Error('Este horário acabou de ser preenchido. Escolha outro.')
            }

            // 3. Create appointment
            const { error: apptError } = await supabase
                .from('appointments')
                .insert([{
                    user_id: userId,
                    client_id: clientId,
                    massage_id: selectedService.id,
                    start_time: startTimeIso,
                    end_time: endTime.toISOString(),
                    status: 'confirmed'
                }])

            if (apptError) throw apptError

            setSuccess(true)
        } catch (err: any) {
            console.error('Booking Error:', err)
            setError(err.message || 'Erro ao realizar agendamento. Tente novamente.')
            setIsSubmitting(false)
            lockRef.current = false
        }
    }

    const generateTimeSlots = () => {
        const dayOfWeek = selectedDate.getDay()
        const custom = professional?.custom_hours?.[dayOfWeek]

        const start = custom?.start ?? (professional?.start_hour ?? 8)
        const end = custom?.end ?? (professional?.end_hour ?? 20)
        const slots: string[] = []

        for (let h = start; h < end; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`)
            slots.push(`${h.toString().padStart(2, '0')}:30`)
        }

        return slots.filter(slot => {
            const [h, m] = slot.split(':').map(Number)
            const slotTime = setMinutes(setHours(selectedDate, h), m)

            // Filter past times
            if (isSameDay(selectedDate, new Date()) && isBefore(slotTime, new Date())) return false

            // Check conflicts with existing appointments
            const hasConflict = appointments.some(appt => {
                if (!appt.start_time || !appt.end_time) return false
                const apptStart = new Date(appt.start_time)
                const apptEnd = new Date(appt.end_time)
                return slotTime >= apptStart && slotTime < apptEnd
            })

            if (hasConflict) return false

            // Check conflicts with absences
            const isAbsent = professional?.absences?.some(absence => {
                const absStart = new Date(absence.start)
                const absEnd = new Date(absence.end)
                return slotTime >= absStart && slotTime < absEnd
            })

            return !isAbsent
        })
    }

    if (loading && step === 1) {
        return (
            <div className="min-h-screen bg-surface-light flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-surface-light to-surface-light">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-dark/40 font-bold uppercase tracking-widest text-xs">Preparando sua agenda...</p>
            </div>
        )
    }

    if (success) {
        return (
            <div className="min-h-screen bg-surface-light p-6 flex items-center justify-center">
                <main className="max-w-md w-full bg-white rounded-[40px] shadow-ios p-10 text-center space-y-6">
                    <div className="w-24 h-24 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4 scale-in">
                        <CheckCircle2 size={48} className="text-success-dark" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-dark">Agendado!</h1>
                    <p className="text-dark/40 font-medium">Tudo pronto, <strong>{clientName}</strong>. Seu horário foi reservado com sucesso no Agenda Pro.</p>
                    <div className="p-4 bg-surface-neutral/30 rounded-2xl text-left space-y-2">
                        <div className="flex items-center text-sm font-bold text-dark/60">
                            <Clock size={16} className="mr-2" />
                            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                        </div>
                        <div className="flex items-center text-sm font-bold text-dark/60">
                            <Briefcase size={16} className="mr-2" />
                            {selectedService?.name}
                        </div>
                    </div>
                    <Button className="w-full h-16" onClick={() => window.location.reload()}>Fazer outro agendamento</Button>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-light bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-surface-light to-surface-light">
            <header className="p-6 md:p-10 flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-bold text-white shadow-ios">
                        {professional?.full_name?.[0] || 'A'}
                    </div>
                    <div>
                        <h1 className="text-xl font-display font-bold text-dark">{professional?.full_name}</h1>
                        <p className="text-dark/40 text-[10px] font-bold uppercase tracking-widest">Agendamento Online</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">Passo {step} de 3</span>
                </div>
            </header>

            <main className="px-6 pb-20 max-w-2xl mx-auto">
                {error && (
                    <div className="mb-6 bg-red-50 p-4 rounded-3xl flex items-center space-x-3 text-red-600 border border-red-100">
                        <AlertCircle size={20} />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                {/* Step 1: Service */}
                {step === 1 && (
                    <div className="space-y-6 fade-in">
                        <h2 className="text-2xl font-display font-bold text-dark">Qual serviço deseja agendar?</h2>
                        <div className="grid grid-cols-1 gap-4">
                            {services.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => { setSelectedService(s); nextStep(); }}
                                    className="p-6 bg-white rounded-[28px] shadow-ios flex items-center justify-between group active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-surface-neutral rounded-xl flex items-center justify-center text-primary">
                                            <Briefcase size={22} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-dark text-lg">{s.name}</h3>
                                            <p className="text-sm text-dark/30 font-bold">{s.duration_minutes} min</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-display font-bold text-primary">R$ {s.price}</span>
                                        <ChevronRight size={18} className="text-dark/10 group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            ))}
                            {services.length === 0 && (
                                <div className="p-10 text-center bg-white/50 rounded-[32px] border-2 border-dashed border-surface-neutral text-dark/20 italic font-medium">
                                    Nenhum serviço disponível no momento.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Date & Time */}
                {step === 2 && (
                    <div className="space-y-6 fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-display font-bold text-dark">Escolha o horário</h2>
                            <button onClick={prevStep} className="text-xs font-bold text-primary uppercase tracking-widest">Voltar</button>
                        </div>

                        <div className="bg-white rounded-[32px] shadow-ios p-6 space-y-4">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
                                {[...Array(20)].map((_, i) => {
                                    const d = new Date()
                                    d.setDate(d.getDate() + i)

                                    // Check if this day is allowed by the professional
                                    const dayOfWeek = d.getDay() // 0 is Sunday, 1 is Monday...
                                    const isWorkingDay = professional?.working_days?.includes(dayOfWeek) ?? true

                                    if (!isWorkingDay) return null

                                    const isSelected = isSameDay(d, selectedDate)
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(d)}
                                            className={cn(
                                                "min-w-[70px] h-[90px] rounded-2xl flex flex-col items-center justify-center transition-all",
                                                isSelected ? "bg-primary text-white shadow-lg" : "bg-surface-light text-dark/40"
                                            )}
                                        >
                                            <span className="text-[10px] font-bold uppercase mb-1">{format(d, 'EEE', { locale: ptBR })}</span>
                                            <span className="text-2xl font-display font-bold">{format(d, 'dd')}</span>
                                        </button>
                                    )
                                }).filter(Boolean)}
                            </div>

                            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                                {generateTimeSlots().map(slot => (
                                    <button
                                        key={slot}
                                        onClick={() => { setSelectedTime(slot); nextStep(); }}
                                        className={cn(
                                            "h-14 rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                                            selectedTime === slot ? "bg-primary text-white" : "bg-surface-neutral/40 text-dark/60 hover:bg-surface-neutral"
                                        )}
                                    >
                                        {slot}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )
                }

                {/* Step 3: Client Info */}
                {step === 3 && (
                    <div className="space-y-6 fade-in">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-display font-bold text-dark">Seus dados</h2>
                            <button onClick={prevStep} className="text-xs font-bold text-primary uppercase tracking-widest" disabled={isSubmitting}>Voltar</button>
                        </div>

                        <form onSubmit={handleBooking} className="bg-white rounded-[32px] shadow-ios p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-dark/40 uppercase ml-2">Qual seu nome?</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-dark/20" size={20} />
                                    <input
                                        type="text"
                                        required
                                        className="ios-input w-full pl-14 h-16"
                                        placeholder="Seu nome completo"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-dark/40 uppercase ml-2">Celular / WhatsApp</label>
                                <div className="relative">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-dark/20" size={20} />
                                    <input
                                        type="tel"
                                        required
                                        className="ios-input w-full pl-14 h-16"
                                        placeholder="(00) 00000-0000"
                                        value={clientPhone}
                                        onChange={e => setClientPhone(maskPhone(e.target.value))}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="bg-surface-light p-5 rounded-2xl flex items-center space-x-4 border border-surface-neutral/30">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary">
                                    <Calendar size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-dark">{selectedService?.name}</p>
                                    <p className="text-xs font-medium text-dark/40">
                                        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} • {selectedTime}
                                    </p>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-16 text-lg"
                                loading={isSubmitting}
                                disabled={!clientName || clientPhone.length < 14}
                            >
                                Confirmar Agendamento
                            </Button>
                        </form>
                    </div>
                )}
            </main >

            <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md p-4 text-center border-t border-surface-neutral/50">
                <p className="text-[10px] text-dark/30 font-bold uppercase tracking-widest">Powered by Agenda Pro</p>
            </footer>
        </div >
    )
}
