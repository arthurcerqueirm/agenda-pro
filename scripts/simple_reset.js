const { createClient } = require('@supabase/supabase-js');
const url = 'https://nbgcmxiejzhnekquvuwg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ2NteGllanpobmVrcXV2dXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MzY2NiwiZXhwIjoyMDg4OTE5NjY2fQ.r7FGQfssnZjerEMcKXJXb6upffmyq0JwX0OAQeZFp5I';
const supabase = createClient(url, key);
const email = 'arthurcerqueira2025@gmail.com';

async function main() {
    console.log('--- RESET PROFUNDO ---');
    console.log('Alvo:', email);

    try {
        // 1. Encontrar o usuário
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (user) {
            console.log('Usuário encontrado no Auth. ID:', user.id);

            // 2. Deletar dados de tabelas relacionadas
            const tables = ['payments', 'appointments', 'massages', 'client_packages', 'clients'];
            for (const table of tables) {
                console.log(`Deletando dados de ${table}...`);
                await supabase.from(table).delete().eq('user_id', user.id);
            }

            // 3. Deletar do Auth
            console.log('Deletando do Supabase Auth...');
            const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
            if (deleteError) {
                console.error('Erro ao deletar do Auth:', deleteError.message);
            } else {
                console.log('Usuário removido do Auth com sucesso.');
            }
        } else {
            console.log('Usuário não encontrado no Auth. Nada para deletar no Auth.');
        }

        // 4. Garantir que está na lista de autorizados
        console.log('Garantindo autorização do e-mail...');
        const { error: upsertError } = await supabase
            .from('authorized_emails')
            .upsert({ email: email.toLowerCase() }, { onConflict: 'email' });

        if (upsertError) throw upsertError;

        // 5. Verificação final
        const { data: { users: finalUsers } } = await supabase.auth.admin.listUsers();
        const stillExists = finalUsers.some(u => u.email.toLowerCase() === email.toLowerCase());

        if (stillExists) {
            console.error('AVISO: O usuário ainda aparece na lista do Auth após o delete!');
        } else {
            console.log('VERIFICAÇÃO: Usuário não consta mais no Auth. Limpeza completa.');
        }

        console.log('--- RESET FINALIZADO ---');
    } catch (e) {
        console.error('FALHA NO RESET:', e.message);
    }
}

main();
