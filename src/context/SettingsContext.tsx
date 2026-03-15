import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from './AuthContext'

interface SettingsConfig {
    startHour: number
    endHour: number
    notificationsEnabled: boolean
    notifyMinutesBefore: number
    workingDays: number[]
    customHours: Record<number, { start: number, end: number }>
    absences: { id: string, start: string, end: string, reason?: string }[]
}

interface SettingsContextType {
    settings: SettingsConfig
    updateSettings: (newSettings: Partial<SettingsConfig>) => void
}

const defaultSettings: SettingsConfig = {
    startHour: 8,
    endHour: 20,
    notificationsEnabled: false,
    notifyMinutesBefore: 30,
    workingDays: [1, 2, 3, 4, 5, 6], // Mon-Sat
    customHours: {},
    absences: [],
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<SettingsConfig>(() => {
        const saved = localStorage.getItem('agendapro_settings')
        if (saved) {
            try {
                return { ...defaultSettings, ...JSON.parse(saved) }
            } catch (e) {
                return defaultSettings
            }
        }
        return defaultSettings
    })

    // Register Service Worker on mount
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error)
        }
    }, [])

    const { user } = useAuth()

    // Sync from DB on mount/user change
    useEffect(() => {
        if (!user) return

        const fetchDBSettings = async () => {
            const { data, error } = await supabase
                .from('profiles_settings')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (!error && data) {
                const dbSettings = {
                    startHour: data.start_hour,
                    endHour: data.end_hour,
                    notificationsEnabled: data.notifications_enabled,
                    notifyMinutesBefore: data.notify_minutes_before,
                    workingDays: data.working_days || defaultSettings.workingDays,
                    customHours: data.custom_hours || defaultSettings.customHours,
                    absences: data.absences || defaultSettings.absences
                }
                setSettings(prev => ({ ...prev, ...dbSettings }))
                // We update localStorage here to keep it in sync for the next app load
                localStorage.setItem('agendapro_settings', JSON.stringify({ ...settings, ...dbSettings }))
            } else if (error && error.code === 'PGRST116') {
                // PGRST116 means "no rows found" - push our current local settings to DB
                console.log('SettingsContext: No settings in DB, pushing local settings...')
                updateSettings(settings)
            }
        }

        fetchDBSettings()
    }, [user])

    const updateSettings = async (newSettings: Partial<SettingsConfig>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings }
            localStorage.setItem('agendapro_settings', JSON.stringify(updated))
            return updated
        })

        // Persist to DB if logged in
        if (user) {
            const dbPayload = {
                user_id: user.id,
                full_name: user.user_metadata?.full_name || 'Profissional',
                start_hour: newSettings.startHour ?? settings.startHour,
                end_hour: newSettings.endHour ?? settings.endHour,
                notifications_enabled: newSettings.notificationsEnabled ?? settings.notificationsEnabled,
                notify_minutes_before: newSettings.notifyMinutesBefore ?? settings.notifyMinutesBefore,
                working_days: newSettings.workingDays ?? settings.workingDays,
                custom_hours: newSettings.customHours ?? settings.customHours,
                absences: newSettings.absences ?? settings.absences
            }

            try {
                const { error } = await supabase
                    .from('profiles_settings')
                    .upsert(dbPayload, { onConflict: 'user_id' })
                if (error) console.error('Error syncing settings to DB:', error)
            } catch (err) {
                console.error('Error in upsert:', err)
            }
        }
    }

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    )
}

export const useSettings = () => {
    const context = useContext(SettingsContext)
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider')
    }
    return context
}
