import React, { useState } from 'react'
import BottomNav from './components/BottomNav'
import { CalendarView } from './pages/CalendarView'
import { ClientList } from './pages/ClientList'
import { FinancialDashboard } from './pages/FinancialDashboard'
import { AdminPanel } from './pages/AdminPanel'
import { useAuth } from './context/AuthContext'
import { Login } from './pages/Login'
import { Flower2 } from 'lucide-react'

// Puxar as rotas de Super Admin
import { SuperAdminLogin } from './pages/SuperAdmin/SuperAdminLogin'
import { SuperAdminDashboard } from './pages/SuperAdmin/SuperAdminDashboard'

type Tab = 'agenda' | 'clients' | 'finance' | 'admin'

// Main App Component encapsulado para lidar com as abas e autenticação comum
const MainApp = () => {
    const { user, loading } = useAuth()
    const [activeTab, setActiveTab] = useState<Tab>('agenda')

    if (loading) {
        return (
            <div className="min-h-screen bg-cream-light flex items-center justify-center">
                <div className="animate-bounce text-sage">
                    <Flower2 size={40} />
                </div>
            </div>
        )
    }

    if (!user) {
        return <Login />
    }

    return (
        <div className="min-h-screen bg-cream-light pb-24 px-4 pt-6">
            <main className="max-w-md mx-auto">
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
