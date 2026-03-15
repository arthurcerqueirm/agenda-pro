import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nbgcmxiejzhnekquvuwg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ2NteGllanpobmVrcXV2dXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MzY2NiwiZXhwIjoyMDg4OTE5NjY2fQ.r7FGQfssnZjerEMcKXJXb6upffmyq0JwX0OAQeZFp5I'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function check() {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, client:client_id(name)')
        .order('start_time', { ascending: false })
        .limit(5)

    if (error) {
        console.error(error)
        return
    }

    console.log('--- Appointments Check ---')
    data.forEach(a => {
        const start = new Date(a.start_time)
        const end = new Date(a.end_time)
        const duration = (end.getTime() - start.getTime()) / (1000 * 60)
        console.log(`ID: ${a.id.slice(0,8)}`)
        console.log(`Client: ${a.client?.name}`)
        console.log(`Start: ${a.start_time} (${start.getMinutes()}m ${start.getSeconds()}s)`)
        console.log(`End:   ${a.end_time} (${end.getMinutes()}m ${end.getSeconds()}s)`)
        console.log(`Duration: ${duration} min`)
        console.log('---')
    })
}

check()
