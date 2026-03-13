import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const URL = Deno.env.get('SUPABASE_URL') ?? ''
const KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''

serve(async (req) => {
  try {
    const supabaseClient = createClient(URL, KEY)
    
    // Ler o body em JSON para capturar o aviso de compra
    const payload = await req.json()
    console.log("Webhook da Cakto recebido:", JSON.stringify(payload))

    // Flexibilidade para achar o e-mail em diferentes escopos do JSON
    const email = payload?.customer?.email 
      || payload?.data?.customer?.email 
      || payload?.buyer?.email 
      || payload?.data?.buyer?.email 
      || payload?.data?.email 
      || payload?.email

    const status = payload?.status || payload?.data?.status || 'approved'

    if (!email) {
      return new Response(JSON.stringify({ error: "Email não encontrado no payload" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      })
    }

    // Provisionamento baseado em status de Pagamento
    if (['approved', 'paid', 'completed'].includes(status)) {
       const { error } = await supabaseClient
         .from('authorized_emails')
         .upsert({ 
            email: email.toLowerCase(), 
            status: 'active',
            updated_at: new Date().toISOString()
         }, { onConflict: 'email' })
         
       if (error) throw error
       
    } else if (['refunded', 'chargeback', 'canceled'].includes(status)) {
       const { error } = await supabaseClient
         .from('authorized_emails')
         .upsert({ 
            email: email.toLowerCase(), 
            status: 'inactive',
            updated_at: new Date().toISOString()
         }, { onConflict: 'email' })
         
       if (error) throw error
    }

    return new Response(
      JSON.stringify({ message: "Webhook processado com sucesso! Acesso liberado/suspenso." }),
      { headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 })
  }
})
