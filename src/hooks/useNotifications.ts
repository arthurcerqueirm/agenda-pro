import { useEffect, useRef } from 'react'
import { supabase } from '../utils/supabase'

export const useNotifications = (enabled: boolean, minutesBefore: number) => {
    const scheduledRef = useRef<Set<string>>(new Set())
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const requestPermission = async (): Promise<boolean> => {
        if (!('Notification' in window)) return false
        if (Notification.permission === 'granted') return true
        const result = await Notification.requestPermission()
        return result === 'granted'
    }

    const sendNotification = async (title: string, body: string) => {
        // Try via Service Worker first (works on mobile)
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                icon: '/logo-celular.png',
            })
            return
        }
        // Fallback: direct Notification API
        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/logo-celular.png' })
        }
    }

    const checkUpcomingAppointments = async () => {
        const now = new Date()
        const windowStart = now
        const windowEnd = new Date(now.getTime() + (minutesBefore + 5) * 60 * 1000)

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    start_time,
                    client:client_id (name),
                    service:massage_id (name)
                `)
                .eq('status', 'confirmed')
                .gte('start_time', windowStart.toISOString())
                .lte('start_time', windowEnd.toISOString())

            if (error || !data) return

            data.forEach((apt: any) => {
                const aptStart = new Date(apt.start_time)
                const msUntil = aptStart.getTime() - now.getTime()
                const minutesUntil = Math.floor(msUntil / 60000)

                // Only fire if it's within our target window and not yet scheduled
                if (minutesUntil <= minutesBefore && minutesUntil >= minutesBefore - 5 && !scheduledRef.current.has(apt.id)) {
                    scheduledRef.current.add(apt.id)
                    const delay = Math.max(0, msUntil - minutesBefore * 60 * 1000)

                    setTimeout(() => {
                        const clientName = Array.isArray(apt.client) ? apt.client[0]?.name : apt.client?.name
                        const serviceName = Array.isArray(apt.service) ? apt.service[0]?.name : apt.service?.name
                        sendNotification(
                            `⏰ Agendamento em ${minutesBefore} minutos`,
                            `${clientName} • ${serviceName}`
                        )
                    }, delay)
                }
            })
        } catch (err) {
            console.error('Notification check error:', err)
        }
    }

    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) clearInterval(timerRef.current)
            return
        }

        // Start checking every 5 minutes
        checkUpcomingAppointments()
        timerRef.current = setInterval(checkUpcomingAppointments, 5 * 60 * 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [enabled, minutesBefore])

    return { requestPermission }
}
