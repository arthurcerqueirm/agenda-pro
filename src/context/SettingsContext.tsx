import React, { createContext, useContext, useState, useEffect } from 'react'

interface SettingsConfig {
    startHour: number
    endHour: number
    notificationsEnabled: boolean
    notifyMinutesBefore: number
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

    const updateSettings = (newSettings: Partial<SettingsConfig>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings }
            localStorage.setItem('agendapro_settings', JSON.stringify(updated))
            return updated
        })
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
