import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const authAdminEmail = Deno.env.get('ADMIN_EMAIL')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verify Authentication
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user || user.email !== authAdminEmail) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, params } = await req.json()

    // 3. Execute Admin Actions
    if (action === 'listUsers') {
      const { data: authData, error: authErr } = await supabase.auth.admin.listUsers()
      if (authErr) throw authErr

      const { data: dbData, error: dbErr } = await supabase
        .from('authorized_emails')
        .select('*')
      
      if (dbErr) throw dbErr

      // Merge data
      const mergedUsers = (authData?.users || []).map(u => {
        const dbRecord = dbData?.find(d => d.email.toLowerCase() === u.email?.toLowerCase())
        return {
          ...u,
          paymentStatus: dbRecord?.status || 'inactive',
          paymentDate: dbRecord?.updated_at || dbRecord?.created_at || null
        }
      })

      return new Response(JSON.stringify({ users: mergedUsers }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'createUser') {
      const { data, error } = await supabase.auth.admin.createUser({
        email: params.email,
        password: params.password,
        email_confirm: true
      })
      if (error) throw error

      // Auto-activate in authorized_emails
      await supabase.from('authorized_emails').upsert(
        { email: params.email.toLowerCase(), status: 'active' },
        { onConflict: 'email' }
      )

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'deleteUser') {
      const { error } = await supabase.auth.admin.deleteUser(params.id)
      if (error) throw error
      
      // Clean up authorized_emails
      // Note: We can only clean up if we have the email. We'll use the params.id to find it if not provided.
      const emailToDelete = params.email;
      if (emailToDelete) {
          await supabase.from('authorized_emails').delete().eq('email', emailToDelete.toLowerCase())
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'updateUserStatus') {
      const { email, status } = params
      const { error } = await supabase
        .from('authorized_emails')
        .update({ status })
        .eq('email', email.toLowerCase())
      
      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
