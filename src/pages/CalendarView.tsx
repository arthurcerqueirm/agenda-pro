import React, { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Trash2, CalendarDays, RefreshCw } from 'lucide-react'
import { ConfirmModal } from '../components/ConfirmModal'
import {
    format,
    addDays,
    addWeeks,
    subDays,
    subWeeks,
    isSameDay,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isToday,
    setHours,
    setMinutes,
    isWithinInterval,
    addMinutes
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '../utils/cn'
import { Button } from '../components/Button'
import { BottomSheet } from '../components/BottomSheet'
import { SchedulingFlow } from '../components/SchedulingFlow'
import { supabase } from '../utils/supabase'
import { useSettings } from '../context/SettingsContext'

// Removing static HOURS, computing inside component now

export const CalendarView: React.FC = () => {
    const { settings } = useSettings()
    const HOURS = Array.from(
        { length: settings.endHour - settings.startHour + 1 },
        (_, i) => settings.startHour + i
    )

    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<Date>(new Date())
    const [isScheduling, setIsScheduling] = useState(false)
    const [isManaging, setIsManaging] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAppointments()
    }, [viewDate])

    // Keep viewDate in sync with selectedDay, and auto-scroll the mobile header
    useEffect(() => {
        const weekStart = startOfWeek(viewDate, { locale: ptBR })
        const weekEnd = endOfWeek(viewDate, { locale: ptBR })
        if (!isWithinInterval(selectedDay, { start: weekStart, end: weekEnd })) {
            setViewDate(selectedDay)
        }

        const element = document.getElementById(`day-${format(selectedDay, 'yyyy-MM-dd')}`)
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        }
    }, [selectedDay])

    const fetchAppointments = async () => {
        if (appointments.length === 0) setLoading(true)
        try {
            const start = subDays(viewDate, 45)
            const end = addDays(viewDate, 45)

            const { data, error } = await supabase
                .from('appointments')
                .select(`
          *,
          client:client_id (name, phone),
          service:massage_id (name, duration_minutes, price)
        `)
                .gte('start_time', start.toISOString())
                .lte('start_time', end.toISOString())
                .order('start_time')

            if (error) throw error
            setAppointments(data || [])
        } catch (err) {
            console.error('Erro ao buscar agendamentos:', err)
        } finally {
            setLoading(false)
        }
    }

    const navigate = (direction: 'prev' | 'next') => {
        const newDate = direction === 'next' ? addWeeks(viewDate, 1) : subWeeks(viewDate, 1)
        setViewDate(newDate)
        setSelectedDay(newDate)
    }

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return
        const distance = touchStart - touchEnd

        if (distance > 50) {
            setSelectedDay(prev => addDays(prev, 1))
        }
        if (distance < -50) {
            setSelectedDay(prev => subDays(prev, 1))
        }
    }

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', selectedAppointment.id)

            if (error) throw error
            setIsManaging(false)
            fetchAppointments()
        } catch (err) {
            console.error('Erro ao desmarcar agendamento:', err)
        }
    }

    const weekStart = startOfWeek(viewDate, { locale: ptBR })
    const days = eachDayOfInterval({
        start: addDays(weekStart, 1), // Start Monday
        end: addDays(weekStart, 6)   // End Saturday
    })

    const getAppointmentForSlot = (day: Date, hour: number) => {
        const slotTime = setMinutes(setHours(day, hour), 0)
        return appointments.find(apt => {
            const aptStart = new Date(apt.start_time)
            const aptEnd = new Date(apt.end_time)
            return isWithinInterval(slotTime, { start: aptStart, end: addMinutes(aptEnd, -1) })
        })
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-display font-bold text-dark">Agenda</h2>
                    <div className="flex items-center space-x-2 text-primary font-bold">
                        <span className="capitalize">{format(viewDate, "MMMM 'de' yyyy", { locale: ptBR })}</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate('prev')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date()
                            setViewDate(today)
                            setSelectedDay(today)
                        }}
                        className="px-4 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-xs font-bold text-primary active:scale-95 transition-transform"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => navigate('next')}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 active:scale-90 transition-transform"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* Day Selector (Mobile Only) */}
            <div className="flex md:hidden overflow-x-auto pb-2 -mx-4 px-4 space-x-3 scrollbar-hide">
                {eachDayOfInterval({
                    start: subDays(new Date(), 30),
                    end: addDays(new Date(), 90)
                }).map((day) => (
                    <button
                        key={day.toString()}
                        id={`day-${format(day, 'yyyy-MM-dd')}`}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                            "flex flex-col items-center min-w-[64px] py-3 rounded-2xl transition-all",
                            isSameDay(day, selectedDay)
                                ? "bg-primary text-white shadow-lg scale-105"
                                : "bg-white text-dark/40 shadow-ios"
                        )}
                    >
                        <span className="text-[10px] font-bold uppercase mb-1">{format(day, 'eee', { locale: ptBR })}</span>
                        <span className="text-lg font-display font-bold">{format(day, 'd')}</span>
                    </button>
                ))}
            </div>

            {/* Agenda Grid */}
            <div
                className="bg-white rounded-ios-lg shadow-ios overflow-hidden relative"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse table-fixed min-w-full md:min-w-[800px]">
                        <thead>
                            <tr className="bg-surface-light/50 border-b border-surface-neutral/50">
                                <th className="w-16 py-4 md:py-3"></th>
                                {/* Desktop Headers */}
                                {days.map((day) => (
                                    <th key={`head-${day.toString()}`} className={cn(
                                        "py-3 px-1 text-center hidden md:table-cell",
                                        isToday(day) ? "bg-primary/10 text-primary" : "text-dark/40"
                                    )}>
                                        <div className="flex flex-col items-center py-1">
                                            <span className="text-[10px] font-bold uppercase">{format(day, 'eee', { locale: ptBR })}</span>
                                            <span className="text-lg font-display font-bold">{format(day, 'd')}</span>
                                        </div>
                                    </th>
                                ))}
                                {/* Mobile Header */}
                                <th className="py-3 px-4 text-left md:hidden">
                                    <div className="flex items-center space-x-2 text-primary">
                                        <CalendarDays size={16} />
                                        <span className="text-sm font-bold capitalize">
                                            {format(selectedDay, "EEEE, d 'de' MMMM", { locale: ptBR })}
                                        </span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody key={selectedDay.toISOString()} className="divide-y divide-surface-neutral/20 fade-in">
                            {/* Skeleton loading rows */}
                            {loading && HOURS.slice(0, 6).map((hour) => (
                                <tr key={`skel-${hour}`}>
                                    <td className="text-center py-6 md:py-4 align-top w-16">
                                        <div className="h-3 w-8 mx-auto rounded-full bg-surface-neutral animate-pulse" />
                                    </td>
                                    {days.map((d) => (
                                        <td key={`skel-${d}-${hour}`} className="p-2 h-16 hidden md:table-cell">
                                            {hour % 3 === 0 && (
                                                <div className="h-10 rounded-xl bg-primary/8 animate-pulse" style={{ animationDelay: `${hour * 60}ms` }} />
                                            )}
                                        </td>
                                    ))}
                                    <td className="p-2 md:hidden h-20">
                                        {hour % 2 === 0 && (
                                            <div className="h-14 rounded-2xl bg-surface-neutral/60 animate-pulse" style={{ animationDelay: `${hour * 80}ms` }} />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {!loading && HOURS.map((hour) => (
                                <tr key={hour} className="group">
                                    <td className="text-center py-6 md:py-4 align-top">
                                        <span className="text-xs font-bold text-dark/30">{hour}:00</span>
                                    </td>

                                    {/* Desktop Slots */}
                                    {days.map((day) => {
                                        const apt = getAppointmentForSlot(day, hour)
                                        const isSlotStart = apt && isSameDay(new Date(apt.start_time), day) && new Date(apt.start_time).getHours() === hour

                                        return (
                                            <td
                                                key={`desktop-${day}-${hour}`}
                                                className={cn(
                                                    "relative p-1 border-r border-surface-neutral/10 last:border-0 h-24 md:h-16 hidden md:table-cell transition-colors",
                                                    !apt && "hover:bg-surface-light/50 cursor-pointer"
                                                )}
                                                onClick={() => {
                                                    if (apt) {
                                                        setSelectedAppointment(apt)
                                                        setIsManaging(true)
                                                    } else {
                                                        setSelectedSlot(setMinutes(setHours(day, hour), 0))
                                                        setIsScheduling(true)
                                                    }
                                                }}
                                            >
                                                {apt ? (
                                                    isSlotStart && (
                                                        <div className="absolute inset-x-1 top-1 bottom-1 bg-primary/20 border-l-4 border-l-primary rounded-xl p-2 z-10 animate-in fade-in zoom-in-95 overflow-hidden">
                                                            <h4 className="text-[10px] font-bold text-primary-dark truncate">{apt.client?.name}</h4>
                                                            <p className="text-[9px] text-primary/80 font-medium truncate">{apt.service?.name}</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                        <Plus size={14} className="text-primary" />
                                                    </div>
                                                )}
                                            </td>
                                        )
                                    })}

                                    {/* Mobile Slot */}
                                    <td
                                        className="relative p-2 md:hidden h-24 transition-colors active:bg-surface-light/50"
                                        onClick={() => {
                                            const apt = getAppointmentForSlot(selectedDay, hour)
                                            if (apt) {
                                                setSelectedAppointment(apt)
                                                setIsManaging(true)
                                            } else {
                                                setSelectedSlot(setMinutes(setHours(selectedDay, hour), 0))
                                                setIsScheduling(true)
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const apt = getAppointmentForSlot(selectedDay, hour)
                                            const isSlotStart = apt && isSameDay(new Date(apt.start_time), selectedDay) && new Date(apt.start_time).getHours() === hour

                                            if (apt) {
                                                return isSlotStart ? (
                                                    <div className="absolute inset-2 bg-primary/10 border-l-4 border-l-primary rounded-2xl p-3 shadow-sm flex flex-col justify-center">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-bold text-primary-dark">{apt.client?.name}</h4>
                                                            <span className="text-[10px] bg-primary/20 text-primary-dark px-2 py-0.5 rounded-full">Ocupado</span>
                                                        </div>
                                                        <p className="text-xs text-primary/70 font-medium">{apt.service?.name}</p>
                                                    </div>
                                                ) : null
                                            }

                                            return (
                                                <div className="h-full w-full border-2 border-dashed border-surface-neutral/30 rounded-2xl flex items-center justify-center">
                                                    <Plus size={20} className="text-dark/10" />
                                                </div>
                                            )
                                        })()}
                                    </td>
                                </tr>
                            ))}
                            {/* Mobile empty state row */}
                            {!loading && (() => {
                                const hasAnyForDay = appointments.some(apt =>
                                    isSameDay(new Date(apt.start_time), selectedDay)
                                )
                                if (hasAnyForDay) return null
                                return (
                                    <tr>
                                        <td />
                                        <td className="py-10 px-4 md:hidden" colSpan={1}>
                                            <div className="flex flex-col items-center gap-3 text-center">
                                                <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: '#EBF3FD' }}>
                                                    <CalendarIcon size={28} style={{ color: '#1A73E8' }} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-dark/70 text-sm">Nenhum atendimento</p>
                                                    <p className="text-xs text-dark/40 mt-0.5">Sua agenda está livre neste dia</p>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedSlot(null); setIsScheduling(true) }}
                                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
                                                    style={{ background: '#1A73E8', boxShadow: '0 4px 12px rgba(26,115,232,0.3)' }}
                                                >
                                                    <Plus size={14} /> Novo Agendamento
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })()}
                        </tbody>
                    </table>
                    {/* Desktop empty state */}
                    {!loading && (() => {
                        const weekHasAny = days.some(day =>
                            appointments.some(apt => isSameDay(new Date(apt.start_time), day))
                        )
                        if (weekHasAny) return null
                        return (
                            <div className="hidden md:flex flex-col items-center gap-4 py-16 border-t border-surface-neutral/30">
                                <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: '#EBF3FD' }}>
                                    <CalendarIcon size={36} style={{ color: '#1A73E8' }} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-dark text-lg">Semana livre</p>
                                    <p className="text-sm text-dark/40 mt-1">Nenhum atendimento agendado para esta semana</p>
                                </div>
                                <button
                                    onClick={() => { setSelectedSlot(null); setIsScheduling(true) }}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:-translate-y-0.5 active:scale-95"
                                    style={{ background: 'linear-gradient(135deg, #1A73E8, #1565C0)', boxShadow: '0 6px 20px rgba(26,115,232,0.35)' }}
                                >
                                    <Plus size={16} /> Agendar um atendimento
                                </button>
                            </div>
                        )
                    })()}
                </div>
            </div>

            {/* Floating Action Button (New Quick Record) */}
            <button
                onClick={() => {
                    setSelectedSlot(null)
                    setIsScheduling(true)
                }}
                className="fixed bottom-24 right-6 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center active:scale-95 transition-transform z-40"
            >
                <Plus size={32} />
            </button>

            {/* Scheduling Flow Sheet */}
            <BottomSheet
                isOpen={isScheduling}
                onClose={() => {
                    setIsScheduling(false)
                    setSelectedSlot(null)
                }}
                title={selectedSlot ? `Agendamento para ${format(selectedSlot, "eeee, HH:mm", { locale: ptBR })}` : "Novo Agendamento"}
            >
                <SchedulingFlow
                    preSelectedDate={selectedSlot ?? undefined}
                    onComplete={() => {
                        setIsScheduling(false)
                        setSelectedSlot(null)
                        fetchAppointments()
                    }}
                />
            </BottomSheet>

            {/* Management Sheet */}
            <BottomSheet
                isOpen={isManaging}
                onClose={() => {
                    setIsManaging(false)
                    setSelectedAppointment(null)
                }}
                title="Detalhes do Agendamento"
            >
                {selectedAppointment && (
                    <div className="space-y-6">
                        <div className="ios-card bg-surface-light border-2 border-primary/20 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center font-display font-bold text-2xl uppercase">
                                    {selectedAppointment.client?.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-dark">{selectedAppointment.client?.name}</h3>
                                    <p className="text-sm font-medium text-dark/40">{selectedAppointment.client?.phone}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-dark/20 flex items-center">
                                        <Clock size={10} className="mr-1" /> Horário
                                    </span>
                                    <p className="font-bold text-dark">
                                        {format(new Date(selectedAppointment.start_time), "HH:mm")}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-dark/20 flex items-center">
                                        <User size={10} className="mr-1" /> Serviço
                                    </span>
                                    <p className="font-bold text-dark truncate">
                                        {selectedAppointment.service?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button variant="secondary" className="h-14 space-x-2 opacity-50 cursor-not-allowed">
                                <RefreshCw size={20} />
                                <span>Reagendar (Em breve)</span>
                            </Button>
                            <Button
                                variant="ghost"
                                className="h-14 text-danger-dark hover:bg-danger/10 space-x-2"
                                onClick={() => setIsConfirmOpen(true)}
                            >
                                <Trash2 size={20} />
                                <span>Desmarcar Serviço</span>
                            </Button>
                        </div>

                        <p className="text-center text-[10px] uppercase font-bold text-dark/20 italic">
                            ID: {selectedAppointment.id.split('-')[0]}..
                        </p>
                    </div>
                )}

            </BottomSheet>

            {/* Confirm delete modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Desmarcar agendamento?"
                message={`Tem certeza que deseja desmarcar o atendimento de ${selectedAppointment?.client?.name ?? 'este cliente'}? Esta ação não pode ser desfeita.`}
                confirmLabel="Desmarcar"
                cancelLabel="Manter"
                variant="danger"
                onConfirm={handleDeleteAppointment}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </div>
    )
}
