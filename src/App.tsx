import React, { useState } from 'react'
import BottomNav from './components/BottomNav'
import SideNav from './components/SideNav'
import { CalendarView } from './pages/CalendarView'
import { ClientList } from './pages/ClientList'
import { FinancialDashboard } from './pages/FinancialDashboard'
import { AdminPanel } from './pages/AdminPanel'
import { useAuth } from './context/AuthContext'
import { Login } from './pages/Login'

// Puxar as rotas de Super Admin
import { SuperAdminLogin } from './pages/SuperAdmin/SuperAdminLogin'
import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard'
import { UpdatePassword } from './pages/UpdatePassword'

type Tab = 'agenda' | 'clients' | 'finance' | 'admin'

// Main App Component encapsulado para lidar com as abas e autenticação comum
const MainApp = () => {
    const { user, loading } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>('agenda')

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
        </div>
    )
}

function App() {
    const [isSuperAdminAuthed, setIsSuperAdminAuthed] = useState(false)

    const isBackoffice = window.location.pathname.startsWith('/backoffice')
    const isUpdatePassword = window.location.pathname.startsWith('/update-password')

    if (isUpdatePassword) {
        return <UpdatePassword />
    }

    if (isBackoffice) {
        if (!isSuperAdminAuthed) {
            return <SuperAdminLogin onLogin={() => setIsSuperAdminAuthed(true)} />
        }
        return <SuperAdminDashboard onLogout={() => setIsSuperAdminAuthed(false)} />
    }

    // Caso não seja /backoffice, roda o app normal SaaS
    return <MainApp />
}

export default App
