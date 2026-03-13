// Seed script: creates realistic fake demo data for the Agenda Pro marketing account
// Usage: node seed_demo_data.mjs

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://nbgcmxiejzhnekquvuwg.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZ2NteGllanpobmVrcXV2dXdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzM0MzY2NiwiZXhwIjoyMDg4OTE5NjY2fQ.r7FGQfssnZjerEMcKXJXb6upffmyq0JwX0OAQeZFp5I'
const TARGET_EMAIL = 'suporteagendaprobr@gmail.com'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d }
const daysFrom = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

// ─── Data Pools ───────────────────────────────────────────────────────────────
const clientNames = [
    'Ana Beatriz Souza', 'Carla Mendes', 'Fernanda Lima', 'Juliana Costa',
    'Mariana Oliveira', 'Patricia Rocha', 'Roberta Ferreira', 'Camila Santos',
    'Larissa Pereira', 'Gabriela Nunes', 'Tânia Vieira', 'Renata Campos',
    'Letícia Alves', 'Viviane Martins', 'Débora Cardoso', 'Lívia Pinto',
    'Simone Gomes', 'Elisângela Barbosa', 'Kátia Nascimento', 'Sandra Ribeiro'
]

const phones = [
    '(11) 98765-4321', '(21) 99123-4567', '(31) 97654-3210', '(41) 98234-5678',
    '(51) 96789-0123', '(61) 95432-1098', '(71) 94567-8901', '(81) 93210-9876',
    '(85) 92345-6789', '(91) 91234-5678', '(11) 96543-2109', '(21) 97890-1234',
    '(31) 98901-2345', '(41) 99012-3456', '(51) 91123-4567', '(61) 92234-5678',
    '(71) 93345-6789', '(81) 94456-7890', '(85) 95567-8901', '(91) 96678-9012'
]

const services = [
    { name: 'Massagem Relaxante', duration_minutes: 60, price: 150.00 },
    { name: 'Massagem Desportiva', duration_minutes: 60, price: 180.00 },
    { name: 'Drenagem Linfática', duration_minutes: 90, price: 200.00 },
    { name: 'Reflexologia Podal', duration_minutes: 45, price: 120.00 },
    { name: 'Hot Stone Massage', duration_minutes: 75, price: 220.00 },
    { name: 'Shiatsu', duration_minutes: 60, price: 160.00 },
]

const paymentMethods = ['pix', 'card', 'cash']

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('🔍 Looking up user ID for', TARGET_EMAIL)

    // 1. Get user ID
    const { data: { users }, error: userErr } = await supabase.auth.admin.listUsers()
    if (userErr) { console.error('Error fetching users:', userErr); process.exit(1) }

    const targetUser = users.find(u => u.email === TARGET_EMAIL)
    if (!targetUser) {
        console.error(`❌ User ${TARGET_EMAIL} not found. Make sure the user exists in Supabase.`)
        process.exit(1)
    }

    const userId = targetUser.id
    console.log('✅ Found user:', userId)

    // 2. Insert Services (massages)
    console.log('\n📋 Inserting services...')
    const { data: insertedServices, error: svcErr } = await supabase
        .from('massages')
        .insert(services.map(s => ({ ...s, user_id: userId, is_active: true })))
        .select()

    if (svcErr) { console.error('Error inserting services:', svcErr); process.exit(1) }
    console.log(`✅ Inserted ${insertedServices.length} services`)

    // 3. Insert Clients
    console.log('\n👥 Inserting clients...')
    const clientsData = clientNames.map((name, i) => ({
        name,
        phone: phones[i],
        email: `${name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '')}@email.com`,
        user_id: userId,
        notes: randomElement(['Cliente frequente', 'Prefere horário matutino', 'Alérgica a alguns óleos', null, null, null]),
    }))

    const { data: insertedClients, error: clientErr } = await supabase
        .from('clients')
        .insert(clientsData)
        .select()

    if (clientErr) { console.error('Error inserting clients:', clientErr); process.exit(1) }
    console.log(`✅ Inserted ${insertedClients.length} clients`)

    // 4. Insert Appointments + Payments
    console.log('\n📅 Inserting appointments and payments...')
    let apptCount = 0
    let payCount = 0

    // Past appointments (paid or unpaid) — last 60 days
    for (let i = 0; i < 60; i++) {
        const client = randomElement(insertedClients)
        const service = randomElement(insertedServices)
        const daysBack = randomInt(1, 60)
        const hour = randomInt(8, 18)
        const start = daysAgo(daysBack)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(start.getTime() + service.duration_minutes * 60000)

        const { data: appt, error: apptErr } = await supabase
            .from('appointments')
            .insert({
                client_id: client.id,
                massage_id: service.id,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                status: 'confirmed',
                user_id: userId,
            })
            .select()
            .single()

        if (apptErr) { console.error('Appt error:', apptErr); continue }
        apptCount++

        // 85% chance of being paid
        if (Math.random() < 0.85) {
            const payDate = new Date(start.getTime() + randomInt(0, 3) * 86400000)
            const { error: payErr } = await supabase
                .from('payments')
                .insert({
                    appointment_id: appt.id,
                    amount: service.price,
                    method: randomElement(paymentMethods),
                    status: 'paid',
                    payment_date: payDate.toISOString(),
                    user_id: userId,
                })

            if (!payErr) payCount++
        }
    }

    // Future appointments — next 14 days
    for (let i = 0; i < 20; i++) {
        const client = randomElement(insertedClients)
        const service = randomElement(insertedServices)
        const daysAhead = randomInt(1, 14)
        const hour = randomInt(8, 18)
        const start = daysFrom(daysAhead)
        start.setHours(hour, 0, 0, 0)
        const end = new Date(start.getTime() + service.duration_minutes * 60000)

        await supabase.from('appointments').insert({
            client_id: client.id,
            massage_id: service.id,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: 'confirmed',
            user_id: userId,
        })
        apptCount++
    }

    console.log(`✅ Inserted ${apptCount} appointments, ${payCount} payments`)
    console.log('\n🎉 Demo data seeded successfully!')
    console.log('   Login as suporteagendaprobr@gmail.com to view the data.')
}

main().catch(console.error)
