import React from 'react'
import { Calendar, Users, DollarSign, Settings } from 'lucide-react'
import { cn } from '../utils/cn'

interface SideNavProps {
    activeTab: 'agenda' | 'clients' | 'finance' | 'admin'
    onTabChange: (tab: 'agenda' | 'clients' | 'finance' | 'admin') => void
}

const SideNav: React.FC<SideNavProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'agenda', label: 'Agenda', icon: Calendar },
        { id: 'clients', label: 'Clientes', icon: Users },
        { id: 'finance', label: 'Financeiro', icon: DollarSign },
        { id: 'admin', label: 'Painel Admin', icon: Settings },
    ] as const

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-surface-neutral hidden md:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-24 flex items-center justify-center border-b border-surface-neutral/50">
                <img src="/logo.png" alt="Agenda Pro" className="w-40 object-contain drop-shadow-sm" />
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-8 px-4 space-y-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={cn(
                            "w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 group relative overflow-hidden",
                            activeTab === id
                                ? "bg-primary/10 text-primary font-bold shadow-sm"
                                : "text-dark/60 hover:bg-surface-light font-medium"
                        )}
                    >
                        {/* Active Indicator Line */}
                        {activeTab === id && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                        )}
                        <Icon size={24} strokeWidth={activeTab === id ? 2.5 : 2} />
                        <span className="text-sm tracking-wide">{label}</span>
                    </button>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-surface-neutral/50">
                <div className="bg-surface-light rounded-xl p-4 flex flex-col items-center">
                    <p className="text-[10px] font-bold uppercase text-dark/30 tracking-widest text-center">Software de Gestão</p>
                    <p className="text-xs font-medium text-dark/60 mt-1 text-center">Versão 1.0.0</p>
                </div>
            </div>
        </aside>
    )
}

export default SideNav
