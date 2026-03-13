import { z } from 'zod'

export const appointmentSchema = z.object({
    client_id: z.string().uuid('Cliente inválido'),
    service_id: z.string().uuid('Serviço inválido'),
    start_time: z.string().datetime('Data de início inválida'),
    status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).default('pending'),
    notes: z.string().optional(),
})

export const clientSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    phone: z.string().min(8, 'Telefone inválido'),
    email: z.string().email('E-mail inválido').optional().or(z.literal('')),
})

export type AppointmentInput = z.infer<typeof appointmentSchema>
export type ClientInput = z.infer<typeof clientSchema>
