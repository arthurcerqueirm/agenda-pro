const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = 'arthurcerqueira2025@gmail.com';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: Credenciais do Supabase não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
    console.log(`Iniciando reset para: ${targetEmail}`);
    try {
        // 1. Buscar usuário
        const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
        if (uError) throw uError;

        const user = users.find(u => u.email === targetEmail);
        if (user) {
            const userId = user.id;
            console.log(`Usuário encontrado ID: ${userId}. Deletando dados...`);

            const tables = ['payments', 'appointments', 'services', 'profiles', 'client_packages'];
            for (const t of tables) {
                const { error: delError } = await supabase.from(t).delete().eq('user_id', userId);
                if (delError) console.warn(`Aviso ao deletar de ${t}:`, delError.message);
                else console.log(`Deletado de ${t}`);
            }

            const { error: authDelError } = await supabase.auth.admin.deleteUser(userId);
            if (authDelError) console.error('Erro ao deletar do Auth:', authDelError.message);
            else console.log('Removido do Supabase Auth.');
        } else {
            console.log('Usuário não encontrado no Auth.');
        }

        // 2. Garantir autorização do e-mail
        console.log(`Garantindo autorização para ${targetEmail}...`);
        const { error: authEmailError } = await supabase
            .from('authorized_emails')
            .upsert({ email: targetEmail }, { onConflict: 'email' });

        if (authEmailError) console.error('Erro ao autorizar e-mail:', authEmailError.message);
        else console.log('E-mail autorizado com sucesso!');

    } catch (err) {
        console.error('Erro fatal:', err.message);
    }
    console.log('Reset concluído.');
}

run();
