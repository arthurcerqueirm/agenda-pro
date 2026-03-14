import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

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

    try {
        // 1. Buscar usuário
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError

        const user = users.find(u => u.email === targetEmail)
        if (!user) {
            console.log(`Usuário ${targetEmail} não encontrado no Auth.`)
        } else {
            const userId = user.id
            console.log(`Usuário encontrado ID: ${userId}. Excluindo dados...`)

            const tables = ['payments', 'appointments', 'massages', 'client_packages']
            for (const table of tables) {
                const { error: delError } = await supabase.from(table).delete().eq('user_id', userId)
                if (delError) console.warn(`Erro ao deletar de ${table}:`, delError.message)
                else console.log(`Dados deletados de ${table}`)
            }

            const { error: authDelError } = await supabase.auth.admin.deleteUser(userId)
            if (authDelError) console.error('Erro ao deletar usuário do Auth:', authDelError)
            else console.log('Usuário deletado do Supabase Auth com sucesso.')
        }

        // 2. Garantir autorização do e-mail
        console.log(`Garantindo que ${targetEmail} está autorizado...`)
        const { error: authEmailError } = await supabase
            .from('authorized_emails')
            .upsert({ email: targetEmail }, { onConflict: 'email' })

        if (authEmailError) console.error('Erro ao autorizar e-mail:', authEmailError.message)
        else console.log(`E-mail ${targetEmail} autorizado com sucesso!`)

    } catch (err) {
        console.error('Erro fatal no reset:', err)
    }

    console.log('Reset concluído.')
}

resetUser()
