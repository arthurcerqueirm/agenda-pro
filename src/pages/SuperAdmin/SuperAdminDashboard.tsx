import React, { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Mail, Lock, Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../../components/Button'
import { supabaseAdmin } from '../../utils/supabaseAdmin'
import { cn } from '../../utils/cn'

interface SuperAdminDashboardProps {
    onLogout: () => void
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onLogout }) => {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState({ email: '', password: '' })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        setError(null)
        try {
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
            if (authError) throw authError

            const { data: emailsData, error: emailsError } = await supabaseAdmin
                .from('authorized_emails')
                .select('*')

            if (emailsError) throw emailsError

            const mergedUsers = (authData?.users || []).map(u => {
                const authRecord = emailsData?.find(e => e.email.toLowerCase() === u.email?.toLowerCase())
                return {
                    ...u,
                    paymentStatus: authRecord?.status || 'inactive',
                    paymentDate: authRecord?.updated_at || authRecord?.created_at || null
                }
            })

            // Sort by creation date descending
            mergedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

            setUsers(mergedUsers)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao carregar lista de clientes (SaaS). Verifique as chaves.')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading(true)
        setError(null)

        try {
            const { data, error } = await supabaseAdmin.auth.admin.createUser({
                email: form.email,
                password: form.password,
                email_confirm: true // Force confirm
            })

            if (error) throw error

            const { error: authError } = await supabaseAdmin
                .from('authorized_emails')
                .upsert({ email: form.email.toLowerCase(), status: 'active' }, { onConflict: 'email' })

            if (authError) {
                console.error('Failed to authorize email, but user was created', authError)
            }

            setForm({ email: '', password: '' })
            setIsAdding(false)
            fetchUsers()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao criar inquilino (Tenant).')
        } finally {
            setActionLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string, email?: string) => {
        if (!confirm(`TEM CERTEZA ABSOLUTA?\nEssa ação deletará a conta ${email} permanentemente, além de quebrar qualquer acesso aos dados antigos atrelados a ela.`)) {
            return
        }

        setActionLoading(true)
        setError(null)

        try {
            const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
            if (error) throw error

            if (email) {
                await supabaseAdmin.from('authorized_emails').delete().eq('email', email)
            }

            fetchUsers()
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao deletar inquilino (Tenant).')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-rose-light/10 pb-24 px-4 pt-6">
            <main className="max-w-2xl mx-auto space-y-6">
                <header className="flex items-center justify-between pb-4 border-b border-rose/10">
                    <div>
                        <h1 className="text-2xl font-display font-bold text-dark flex items-center">
                            <Users className="mr-3 text-rose-dark" size={24} />
                            Gestão de Locatários
                        </h1>
                        <p className="text-dark/40 text-sm mt-1">SaaS Backoffice Global</p>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-10 h-10 bg-white shadow-ios rounded-full flex items-center justify-center text-dark/40 hover:text-rose-dark active:scale-90 transition-all"
                        title="Sair"
                    >
                        <ArrowLeft size={20} />
                    </button>
                </header>

                {error && (
                    <div className="bg-rose/10 text-rose-dark p-4 rounded-xl text-center font-bold text-sm">
                        {error}
                    </div>
                )}

                {/* Bloco de Adicionar */}
                {!isAdding ? (
                    <Button
                        className="w-full h-14 bg-rose-dark hover:bg-rose-dark/90 text-white shadow-lg space-x-2"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus size={20} />
                        <span>Criar Nova Clínica / Usuário</span>
                    </Button>
                ) : (
                    <div className="ios-card bg-white border-2 border-rose/20 animate-in fade-in zoom-in-95">
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <h3 className="font-bold text-lg text-dark">Dados de Acesso</h3>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-dark/40 ml-1">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                                    <input
                                        type="email"
                                        required
                                        className="ios-input w-full pl-12 bg-cream-light/50"
                                        placeholder="clinica@exemplo.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-dark/40 ml-1">Senha Inicial</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-dark/30" size={20} />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="ios-input w-full pl-12 bg-cream-light/50"
                                        placeholder="Min 6 caracteres"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-12 border-rose-dark/20 text-rose-dark"
                                    onClick={() => { setIsAdding(false); setForm({ email: '', password: '' }) }}
                                    disabled={actionLoading}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-12 bg-rose-dark hover:bg-rose-dark/90 text-white"
                                    loading={actionLoading}
                                >
                                    Criar Acesso
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Lista de Tenantes */}
                <div className="space-y-4">
                    <h3 className="font-display font-bold text-lg text-dark flex items-center justify-between">
                        Contas Ativas no Banco
                        {loading && <Loader2 className="animate-spin text-rose-dark" size={20} />}
                    </h3>

                    {loading && users.length === 0 ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-rose-dark/20" size={40} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 bg-white/50 rounded-2xl border-2 border-dashed border-rose/20 text-dark/30 italic">
                            Nenhum tenant encontrado.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((u) => (
                                <div key={u.id} className="ios-card bg-white flex flex-col sm:flex-row sm:items-center justify-between group hover:border-rose/30 transition-colors">
                                    <div className="mb-4 sm:mb-0">
                                        <div className="flex items-center space-x-2">
                                            <div className="w-10 h-10 bg-rose-dark/10 text-rose-dark rounded-xl flex items-center justify-center font-bold uppercase">
                                                {u.email?.[0] || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-dark">{u.email}</h4>
                                                <span className="text-[10px] font-mono text-dark/30 break-all bg-cream-light px-2 py-0.5 rounded">
                                                    ID: {u.id}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-auto w-full">
                                        <div className="text-right flex flex-col mr-2">
                                            <span className="text-[10px] font-bold uppercase text-dark/30">
                                                {u.paymentStatus === 'active' ? 'Renovado/Pago' : 'Situação'}
                                            </span>
                                            {u.paymentStatus === 'active' ? (
                                                <div className="flex items-center justify-end space-x-1 text-sage font-bold mt-0.5" title="Acesso Liberado">
                                                    <CheckCircle2 size={13} />
                                                    <span className="text-xs">
                                                        {u.paymentDate ? new Date(u.paymentDate).toLocaleDateString('pt-BR') : 'Ativo'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end space-x-1 text-rose-dark font-bold mt-0.5" title="Acesso Bloqueado">
                                                    <XCircle size={13} />
                                                    <span className="text-xs">Pendente</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex flex-col border-l border-dark/10 pl-3">
                                            <span className="text-[10px] font-bold uppercase text-dark/30">Criado em</span>
                                            <span className="text-xs font-medium text-dark/60 mt-0.5">
                                                {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteUser(u.id, u.email)}
                                            disabled={actionLoading}
                                            className="w-10 h-10 ml-2 bg-rose-light/30 text-rose-dark rounded-xl flex items-center justify-center hover:bg-rose-dark hover:text-white active:scale-95 transition-all disabled:opacity-50"
                                            title="Deletar Conta Permanentemente"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
