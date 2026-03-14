import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const targetEmail = 'arthurcerqueira2025@gmail.com'

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_SERVICE_ROLE_KEY não encontrados no .env')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

async function resetUser() {
    console.log(`Iniciando reset para: ${targetEmail}`)

    // 1. Buscar usuário
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
        console.error('Erro ao listar usuários:', listError)
        return
    }

    const user = users.find(u => u.email === targetEmail)
    if (!user) {
        console.log(`Usuário ${targetEmail} não encontrado no Auth. Verificando se e-mail está autorizado...`)
    } else {
        const userId = user.id
        console.log(`Usuário encontrado ID: ${userId}. Excluindo dados...`)

        // 2. Excluir dados das tabelas (Cascade costuma estar ativo se as FK forem setadas com onDelete: cascade, mas vamos garantir)
        // Ordem importa se não houver cascade total
        const tables = ['payments', 'appointments', 'massages', 'client_packages']
        
        for (const table of tables) {
            const { error: delError } = await supabase.from(table).delete().eq('user_id', userId)
            if (delError) {
                console.warn(`Erro ao deletar de ${table}:`, delError.message)
            } else {
                console.log(`Dados deletados de ${table}`)
            }
        }

        // 3. Excluir o usuário do Auth
        const { error: authDelError } = await supabase.auth.admin.deleteUser(userId)
        if (authDelError) {
            console.error('Erro ao deletar usuário do Auth:', authDelError)
        } else {
            console.log('Usuário deletado do Supabase Auth com sucesso.')
        }
    }

    // 4. Garantir que o e-mail está na lista de autorizados (para simular pós-pagamento)
    console.log(`Garantindo que ${targetEmail} está na lista de autorizados (authorized_emails)...`)
    
    // Supondo que a tabela se chama 'authorized_emails' baseado no RPC 'is_email_authorized'
    // Se não existir, o script falhará aqui e investigaremos o nome correto.
    const { error: authEmailError } = await supabase
        .from('authorized_emails')
        .upsert({ email: targetEmail }, { onConflict: 'email' })

    if (authEmailError) {
        console.error('Erro ao autorizar e-mail:', authEmailError.message)
        console.log('Tentando verificar o nome da tabela via RPC ou schema...')
    } else {
        console.log(`E-mail ${targetEmail} autorizado com sucesso!`)
    }

    console.log('Reset concluído.')
}

resetUser()
