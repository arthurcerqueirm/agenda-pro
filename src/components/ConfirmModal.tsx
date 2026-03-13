import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Info, X } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    variant?: 'danger' | 'primary'
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onConfirm,
    onCancel,
    title,
    message,
    confirmLabel = 'Confirmar',
    cancelLabel = 'Cancelar',
    variant = 'danger',
}) => {
    const isDanger = variant === 'danger'

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onCancel}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Modal card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 16 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                        className="fixed inset-0 z-[101] flex items-center justify-center px-5 pointer-events-none"
                    >
                        <div
                            className="pointer-events-auto w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
                            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
                        >
                            {/* Top accent bar */}
                            <div
                                className="h-1 w-full"
                                style={{
                                    background: isDanger
                                        ? 'linear-gradient(90deg, #E55B5B, #DC2626)'
                                        : 'linear-gradient(90deg, #1A73E8, #1565C0)',
                                }}
                            />

                            <div className="p-6">
                                {/* Close button */}
                                <div className="flex items-start justify-between mb-4">
                                    {/* Icon */}
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                        style={{
                                            background: isDanger ? '#FEE2E2' : '#EBF3FD',
                                        }}
                                    >
                                        {isDanger
                                            ? <AlertTriangle size={22} style={{ color: '#DC2626' }} />
                                            : <Info size={22} style={{ color: '#1A73E8' }} />
                                        }
                                    </div>
                                    <button
                                        onClick={onCancel}
                                        className="p-2 rounded-full transition-colors"
                                        style={{ color: '#9CA3AF' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#F3F4F6')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Text */}
                                <h3
                                    className="text-lg font-bold mb-2"
                                    style={{ fontFamily: 'Outfit, sans-serif', color: '#1A1A2E' }}
                                >
                                    {title}
                                </h3>
                                <p className="text-sm leading-relaxed mb-6" style={{ color: '#6B7280' }}>
                                    {message}
                                </p>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 h-11 rounded-2xl font-semibold text-sm transition-all duration-200 active:scale-95"
                                        style={{
                                            background: '#F3F4F6',
                                            color: '#374151',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#E5E7EB')}
                                        onMouseLeave={e => (e.currentTarget.style.background = '#F3F4F6')}
                                    >
                                        {cancelLabel}
                                    </button>
                                    <button
                                        onClick={() => { onConfirm(); onCancel() }}
                                        className="flex-1 h-11 rounded-2xl font-bold text-sm text-white transition-all duration-200 active:scale-95"
                                        style={{
                                            background: isDanger
                                                ? 'linear-gradient(135deg, #E55B5B, #DC2626)'
                                                : 'linear-gradient(135deg, #1A73E8, #1565C0)',
                                            boxShadow: isDanger
                                                ? '0 4px 14px rgba(220,38,38,0.3)'
                                                : '0 4px 14px rgba(26,115,232,0.3)',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                    >
                                        {confirmLabel}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
