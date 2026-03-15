import React, { useState, useEffect } from 'react'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import { CalendarView } from './pages/CalendarView'
import { ClientList } from './pages/ClientList'
import { FinancialDashboard } from './pages/FinancialDashboard'
import { AdminPanel } from './pages/AdminPanel'
import { useAuth } from './context/AuthContext'
import { useSettings } from './context/SettingsContext'
import { useNotifications } from './hooks/useNotifications'
import { Login } from './pages/Login'
import { LandingPage } from './pages/LandingPage'

import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard'
import { UpdatePassword } from './pages/UpdatePassword'
import { WelcomeOnboarding } from './pages/WelcomeOnboarding'
import { SetupOnboarding } from './pages/SetupOnboarding'
import { ErrorBoundary } from './components/ErrorBoundary'
import { UserTour } from './components/UserTour'
import { PublicBooking } from './pages/PublicBooking'

type Tab = 'agenda' | 'clients' | 'finance' | 'admin'

// Main App Component encapsulado para lidar com as abas e autenticação comum
const MainApp = () => {
    const { user, loading } = useAuth()
    const { settings } = useSettings()
    const [activeTab, setActiveTab] = useState<Tab>('agenda')

    // Hook de notificações — ativo apenas se o usuário habilitou
    useNotifications(settings.notificationsEnabled, settings.notifyMinutesBefore)

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-light flex items-center justify-center p-6">
                <img src="/logo.png" alt="Agenda Pro" className="w-64 md:w-80 h-auto animate-pulse object-contain filter drop-shadow-md" />
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <div className="min-h-screen bg-surface-light pb-36 md:pb-8 flex">
            <SideNav activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="flex-1 w-full max-w-md md:max-w-6xl mx-auto md:ml-64 px-4 pt-6 transition-all duration-300">
                {activeTab === 'agenda' && <CalendarView />}
                {activeTab === 'clients' && <ClientList />}
                {activeTab === 'finance' && <FinancialDashboard />}
                {activeTab === 'admin' && <AdminPanel />}
            </main>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
            <UserTour activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
    )
}

function App() {

    const path = window.location.pathname
    const isBackoffice = path.startsWith('/backoffice')
    const isUpdatePassword = path.startsWith('/update-password')
    const isWelcome = path.startsWith('/welcome')
    const isSetup = path.startsWith('/setup')
    const isApp = path.startsWith('/app')
    const isBooking = path.startsWith('/b/')

    // Redirect logged-in users from landing to /app
    useEffect(() => {
        if (!isApp && !isBackoffice && !isUpdatePassword && !isWelcome && !isSetup) {
            import('./utils/supabase').then(({ supabase }) => {
                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) window.location.href = '/app'
                })
            })
        }
    }, [])

    if (isUpdatePassword) return <UpdatePassword />

    if (isWelcome) return <WelcomeOnboarding />

    if (isSetup) return <SetupOnboarding />

    // /b/:userId -> Public Booking Page
    if (isBooking) {
        const userId = path.split('/')[2]
        return <PublicBooking userId={userId} />
    }

    // /app -> main SaaS app
    if (isApp) return (
        <ErrorBoundary>
            <MainApp />
        </ErrorBoundary>
    )

    // / -> Landing Page
    return <LandingPage />
}

export default App
