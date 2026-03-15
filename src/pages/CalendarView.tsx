import React, { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Trash2, CalendarDays, RefreshCw, AlertCircle, Plane } from 'lucide-react'
import { ConfirmModal } from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

const fetchAppointments = async (viewDate: Date, userId: string) => {
    const start = subDays(viewDate, 45)
    const end = addDays(viewDate, 45)

    console.log('CalendarView: Fetching appointments for:', userId, 'Interval:', start.toISOString(), 'to', end.toISOString())

    const { data, error } = await supabase
        .from('appointments')
        .select(`
            *,
            client:client_id (name, phone),
            service:massage_id (name, duration_minutes, price)
        `)
        .eq('user_id', userId)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .order('start_time')

    if (error) {
        console.error('CalendarView: Error fetching appointments:', error)
        throw error
    }

    console.log('CalendarView: Found appointments:', data?.length || 0)
    return data || []
}

// Removing static HOURS, computing inside component now

export const CalendarView: React.FC = () => {
    const { settings } = useSettings()
    const [viewDate, setViewDate] = useState(new Date())
    const [selectedDay, setSelectedDay] = useState<Date>(new Date())
    const [isScheduling, setIsScheduling] = useState(false)
    const [isManaging, setIsManaging] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null)

    const [touchStart, setTouchStart] = useState<number | null>(null)
    const [touchEnd, setTouchEnd] = useState<number | null>(null)

    const queryClient = useQueryClient()
    const { user } = useAuth()

    const weekStart = startOfWeek(viewDate, { locale: ptBR })
    const days = React.useMemo(() => eachDayOfInterval({
        start: weekStart, // Start Sunday
        end: addDays(weekStart, 6)   // End Saturday
    }).filter(day => settings.workingDays?.includes(day.getDay()) ?? true), [weekStart, settings.workingDays])

    const { data: appointments = [], isLoading, error: queryError } = useQuery({
        queryKey: ['appointments', user?.id, format(viewDate, 'yyyy-MM-dd')],
        queryFn: () => fetchAppointments(viewDate, user?.id || ''),
        enabled: !!user?.id
    })

    // Compute HOURS dynamically to strictly follow working hours and existing appointments
    const HOURS = React.useMemo(() => {
        // Start with a safe range but then find the tightest fit
        let start = 24
        let end = 0

        // 1. Check working hours of visible days
        if (window.innerWidth >= 768) {
            // Desktop: Check all days in the week
            days.forEach(d => {
                const dayOfWeek = d.getDay()
                const custom = settings.customHours?.[dayOfWeek]
                const dStart = custom?.start ?? settings.startHour
                const dEnd = custom?.end ?? settings.endHour
                if (dStart < start) start = dStart
                if (dEnd > end) end = dEnd
            })
        } else {
            // Mobile: Check only the selected day
            const dayOfWeek = selectedDay.getDay()
            const custom = settings.customHours?.[dayOfWeek]
            start = custom?.start ?? settings.startHour
            end = custom?.end ?? settings.endHour
        }

        // 2. We no longer expand based on appointments. The grid is strictly bounded 
        // by the professional's configured working hours to keep it clean.

        // Safety fallback if no working hours found
        if (start > end || start === 24) {
            start = settings.startHour
            end = settings.endHour
        }

        return Array.from({ length: Math.max(1, end - start + 1) }, (_, i) => start + i)
    }, [settings.startHour, settings.endHour, settings.customHours, appointments, selectedDay, days])

    useEffect(() => {
        if (user) {
            console.log('CalendarView: Logged in user ID:', user.id);
            console.log('CalendarView: Settings:', settings);
        }
    }, [user, settings]);

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] })
            setIsManaging(false)
            setSelectedAppointment(null)
        }
    })

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



    const navigate = (direction: 'prev' | 'next') => {
        const newDate = direction === 'next' ? addWeeks(viewDate, 1) : subWeeks(viewDate, 1)
        setViewDate(newDate)
        setSelectedDay(newDate)
    }

    // If selectedDay is not in workingDays (e.g. after settings change), move to next available
    useEffect(() => {
        if (settings.workingDays && !settings.workingDays.includes(selectedDay.getDay())) {
            let nextWorking = addDays(selectedDay, 1)
            let count = 0
            while (!settings.workingDays.includes(nextWorking.getDay()) && count < 7) {
                nextWorking = addDays(nextWorking, 1)
                count++
            }
            setSelectedDay(nextWorking)
        }
    }, [settings.workingDays])

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null)
        setTouchStart(e.targetTouches[0].clientX)
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX)
    }

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd || !settings.workingDays) return
        const distance = touchStart - touchEnd

        if (distance > 50) {
            // Find next working day
            let nextDay = addDays(selectedDay, 1)
            while (!settings.workingDays.includes(nextDay.getDay())) {
                nextDay = addDays(nextDay, 1)
            }
            setSelectedDay(nextDay)
        }
        if (distance < -50) {
            // Find previous working day
            let prevDay = subDays(selectedDay, 1)
            while (!settings.workingDays.includes(prevDay.getDay())) {
                prevDay = subDays(prevDay, 1)
            }
            setSelectedDay(prevDay)
        }
    }

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return
        deleteMutation.mutate(selectedAppointment.id)
    }

    // Fallback if no days are visible in this specific range (unlikely but safe)
    if (days.length === 0 && settings.workingDays?.length > 0) {
        // Adjust logic if needed or just show the days as is
    }

    // If selectedDay is not in workingDays (e.g. after settings change), move to next available
    useEffect(() => {
        if (settings.workingDays && !settings.workingDays.includes(selectedDay.getDay())) {
            let nextWorking = addDays(selectedDay, 1)
            let count = 0
            while (!settings.workingDays.includes(nextWorking.getDay()) && count < 7) {
                nextWorking = addDays(nextWorking, 1)
                count++
            }
            setSelectedDay(nextWorking)
        }
    }, [settings.workingDays])

    const getAppointmentForSlot = (day: Date, hour: number) => {
        const slotTimeStart = setMinutes(setHours(day, hour), 0)
        const slotTimeEnd = addMinutes(slotTimeStart, 59)

        return appointments.find((apt: any) => {
            const aptStart = new Date(apt.start_time)
            const aptEnd = new Date(apt.end_time)

            // Check if appointment overlaps with this hour slot
            // Use a small buffer (1 minute) to avoid "leaks" from sub-minute precision
            const buffer = 60000
            return (
                (aptStart >= slotTimeStart && aptStart <= slotTimeEnd) || // Starts in this hour
                (aptStart < slotTimeStart && aptEnd.getTime() > (slotTimeStart.getTime() + buffer)) // Spans significantly into this hour
            )
        })
    }

    const hasUpcomingInNextWeek = React.useMemo(() => {
        if (!appointments.length) return false
        const nextWeekStart = addDays(viewDate, 7)
        const nextWeekEnd = addDays(nextWeekStart, 7)
        return appointments.some((apt: any) => {
            const d = new Date(apt.start_time)
            return isWithinInterval(d, { start: nextWeekStart, end: nextWeekEnd })
        })
    }, [appointments, viewDate])

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
                }).filter(day => settings.workingDays?.includes(day.getDay()) ?? true)
                    .map((day) => (
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
                            {isLoading && HOURS.slice(0, 6).map((hour) => (
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
                            {isLoading && queryError && (
                                <tr>
                                    <td colSpan={days.length + 1} className="py-20 text-center text-danger opacity-60">
                                        <div className="flex flex-col items-center gap-2">
                                            <AlertCircle size={32} />
                                            <p className="font-bold">Erro ao carregar agenda</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!isLoading && HOURS.map((hour) => (
                                <tr key={hour} className="group">
                                    <td className="text-center py-6 md:py-4 align-top">
                                        <span className="text-xs font-bold text-dark/30">{hour}:00</span>
                                    </td>

                                    {/* Desktop Slots */}
                                    {days.map((day) => {
                                        const apt = getAppointmentForSlot(day, hour)
                                        return (
                                            <td
                                                key={`desktop-${day}-${hour}`}
                                                className={cn(
                                                    "relative p-1 border-r border-surface-neutral/10 last:border-0 h-24 md:h-16 hidden md:table-cell transition-colors",
                                                    !apt && "hover:bg-surface-light/50"
                                                )}
                                                onClick={() => {
                                                    if (apt) {
                                                        setSelectedAppointment(apt)
                                                        setIsManaging(true)
                                                    }
                                                }}
                                            >
                                                {(() => {
                                                    const slotStart = setMinutes(setHours(day, hour), 0)
                                                    const isAbsent = settings.absences?.some(abs => {
                                                        const start = new Date(abs.start)
                                                        const end = new Date(abs.end)
                                                        return slotStart >= start && slotStart < end
                                                    })

                                                    if (isAbsent) return (
                                                        <div className="absolute inset-0 bg-primary/5 flex items-center justify-center cursor-not-allowed group-hover:bg-primary/10 transition-colors border-l-4 border-l-primary/20">
                                                            <div className="flex flex-col items-center opacity-40">
                                                                <Plane size={12} className="text-primary" />
                                                                <span className="text-[8px] font-bold uppercase mt-1">Ausente</span>
                                                            </div>
                                                        </div>
                                                    )

                                                    if (apt) return (
                                                        <div className={cn(
                                                            "absolute inset-x-1 top-1 bottom-1 border-l-4 rounded-xl p-2 z-10 animate-in fade-in zoom-in-95 overflow-hidden transition-all",
                                                            new Date(apt.start_time).getHours() === hour
                                                                ? "bg-primary/20 border-l-primary"
                                                                : "bg-primary/5 border-l-primary/30 opacity-40 hover:opacity-100"
                                                        )}>
                                                            {new Date(apt.start_time).getHours() === hour && (
                                                                <>
                                                                    <h4 className="text-[10px] font-bold text-primary-dark truncate">{apt.client?.name || 'Cliente s/ nome'}</h4>
                                                                    <p className="text-[9px] text-primary/80 font-medium truncate">{apt.service?.name}</p>
                                                                </>
                                                            )}
                                                            {new Date(apt.start_time).getHours() < hour && (
                                                                <div className="h-full flex items-center justify-center">
                                                                    <span className="text-[8px] font-bold uppercase tracking-tighter text-primary/40 rotate-90 whitespace-nowrap">Continuação</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )

                                                    const dCustom = settings.customHours?.[day.getDay()]
                                                    const isOutside = dCustom ? (hour < dCustom.start || hour >= dCustom.end) : (hour < settings.startHour || hour >= settings.endHour)

                                                    if (isOutside) return (
                                                        <div className="absolute inset-0 bg-surface-neutral/10 flex items-center justify-center cursor-not-allowed group-hover:bg-surface-neutral/20 transition-colors">
                                                            <div className="flex flex-col items-center opacity-30">
                                                                <Clock size={12} className="text-dark/40" />
                                                                <span className="text-[8px] font-bold uppercase mt-1">Fechado</span>
                                                            </div>
                                                        </div>
                                                    )

                                                    return (
                                                        <div
                                                            className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setSelectedSlot(slotStart)
                                                                setIsScheduling(true)
                                                            }}
                                                        >
                                                            <Plus size={14} className="text-primary" />
                                                        </div>
                                                    )
                                                })()}
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
                                                const slotStart = setMinutes(setHours(selectedDay, hour), 0)
                                                const isAbsent = settings.absences?.some(abs => {
                                                    const start = new Date(abs.start)
                                                    const end = new Date(abs.end)
                                                    return slotStart >= start && slotStart < end
                                                })

                                                const dCustom = settings.customHours?.[selectedDay.getDay()]
                                                const isOutside = dCustom ? (hour < dCustom.start || hour >= dCustom.end) : (hour < settings.startHour || hour >= settings.endHour)

                                                if (!isOutside && !isAbsent) {
                                                    setSelectedSlot(slotStart)
                                                    setIsScheduling(true)
                                                }
                                            }
                                        }}
                                    >
                                        {(() => {
                                            const apt = getAppointmentForSlot(selectedDay, hour)
                                            const slotStart = setMinutes(setHours(selectedDay, hour), 0)
                                            const isAbsent = settings.absences?.some(abs => {
                                                const start = new Date(abs.start)
                                                const end = new Date(abs.end)
                                                return slotStart >= start && slotStart < end
                                            })

                                            if (isAbsent) return (
                                                <div className="absolute inset-0 bg-primary/5 rounded-2xl flex flex-col items-center justify-center border-2 border-primary/20 shadow-inner">
                                                    <Plane size={24} className="text-primary/40" />
                                                    <span className="text-[10px] font-bold uppercase mt-1 text-primary/60">Ausente</span>
                                                </div>
                                            )

                                            if (apt) {
                                                const aptDate = new Date(apt.start_time)
                                                return (
                                                    <div className={cn(
                                                        "absolute inset-2 border-l-4 rounded-2xl p-3 shadow-sm flex flex-col justify-center transition-all",
                                                        aptDate.getHours() === hour ? "bg-primary/10 border-l-primary" : "bg-primary/5 border-l-primary/20 opacity-60"
                                                    )}>
                                                        {aptDate.getHours() === hour ? (
                                                            <>
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <h4 className="font-bold text-primary-dark">{apt.client?.name || 'Cliente'}</h4>
                                                                    <span className="text-[10px] bg-primary/20 text-primary-dark px-2 py-0.5 rounded-full font-bold">Início</span>
                                                                </div>
                                                                <p className="text-xs text-primary/70 font-medium">{apt.service?.name}</p>
                                                            </>
                                                        ) : (
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse" />
                                                                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Continuação...</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            }

                                            const dCustom = settings.customHours?.[selectedDay.getDay()]
                                            const isOutside = dCustom ? (hour < dCustom.start || hour >= dCustom.end) : (hour < settings.startHour || hour >= settings.endHour)

                                            if (isOutside) return (
                                                <div className="absolute inset-0 bg-surface-neutral/10 rounded-2xl flex flex-col items-center justify-center opacity-30 shadow-inner">
                                                    <Clock size={20} className="text-dark/40" />
                                                    <span className="text-[10px] font-bold uppercase mt-1">Fechado</span>
                                                </div>
                                            )

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
                            {!isLoading && (() => {
                                const hasAnyForDay = appointments.some((apt: any) =>
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
                    {!isLoading && (() => {
                        const weekHasAny = days.some(day =>
                            appointments.some((apt: any) => isSameDay(new Date(apt.start_time), day))
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
                id="tour-new-apt"
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
                        queryClient.invalidateQueries({ queryKey: ['appointments'] })
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
