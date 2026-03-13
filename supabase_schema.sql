-- Clinica Luciana Supabase Schema (Multi-Tenancy Fix)

-- 1. Base Tables Creation (Will effectively skip if they already exist, without updating columns)
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birth_date DATE,
    notes TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.massages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    price DECIMAL(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    massage_id UUID REFERENCES public.massages(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'cancelled', 'pending')) DEFAULT 'pending',
    notes TEXT,
    google_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method TEXT CHECK (method IN ('pix', 'card', 'cash')),
    status TEXT CHECK (status IN ('paid', 'pending', 'partial')) DEFAULT 'pending',
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ADD THE MISSING COLUMNS (This is what fixes the error, updating existing tables)
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.massages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 3. Cleanup Old Policies (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.clients;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.massages;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated full access" ON public.payments;
DROP POLICY IF EXISTS "Allow public read access to active massages" ON public.massages;

-- 4. Enable RLS (Row Level Security)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.massages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 5. Multi-Tenant Policies (O usuário só pode ver/modificar O QUE ELE CRIOU)
CREATE POLICY "Users can only access their own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own massages" ON public.massages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own appointments" ON public.appointments FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only access their own payments" ON public.payments FOR ALL USING (auth.uid() = user_id);

-- 6. SaaS Authorization System (Cakto Webhook Target)
CREATE TABLE IF NOT EXISTS public.authorized_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Force add column if table already existed without it
ALTER TABLE public.authorized_emails ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Ativa RLS para que ninguém possa ler ou escrever diretamente
ALTER TABLE public.authorized_emails ENABLE ROW LEVEL SECURITY;

-- 7. Função Segura para Checagem pelo Frontend (Bypass RLS)
-- Isso permite que o aplicativo React, mesmo deslogado, descubra se o email pagou, mas sem expor a lista de todos os pagantes
CREATE OR REPLACE FUNCTION public.is_email_authorized(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.authorized_emails 
    WHERE email = check_email AND status = 'active'
  );
END;
$$;
