import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nbgcmxiejzhnekquvuwg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ2NteGllanpobmVrcXV2dXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MzY2NiwiZXhwIjoyMDg4OTE5NjY2fQ.r7FGQfssnZjerEMcKXJXb6upffmyq0JwX0OAQeZFp5I'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkColumns() {
    const { data, error } = await supabase
        .from('profiles_settings')
        .select('*')
        .limit(1)

    if (error) {
        console.error(error)
        return
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]))
    } else {
        console.log('No data found, but table exists. Trying to fetch one record or just checking structure.')
        // In case table is empty, we can't see columns this way easily without RPC or similar
    }
}

checkColumns()
