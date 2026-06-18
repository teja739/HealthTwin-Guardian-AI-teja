-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  blood_group TEXT DEFAULT 'O+',
  allergies TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  conditions TEXT[] DEFAULT '{}',
  goals TEXT[] DEFAULT '{}',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  specialty TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  hospital_name TEXT NOT NULL,
  appointment_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'Confirmed' NOT NULL
);

-- 3. Create Emergency Contacts Table
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relation TEXT NOT NULL
);

-- 4. Create Wellness Logs Table
CREATE TABLE IF NOT EXISTS public.wellness_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  date DATE NOT NULL,
  steps INTEGER DEFAULT 0,
  water_ml INTEGER DEFAULT 0,
  sleep_hours NUMERIC DEFAULT 0,
  mood TEXT,
  CONSTRAINT unique_user_date UNIQUE (user_email, date)
);

-- 5. Create Medication Logs Table
CREATE TABLE IF NOT EXISTS public.medication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  date DATE NOT NULL,
  medicine_name TEXT NOT NULL,
  time_of_day TEXT NOT NULL, -- 'morning' | 'night'
  taken BOOLEAN DEFAULT false NOT NULL,
  taken_time TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_date_med_time UNIQUE (user_email, date, medicine_name, time_of_day)
);

-- 6. Create Family Members Table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  name TEXT NOT NULL,
  relation TEXT NOT NULL,
  age INTEGER,
  blood_group TEXT,
  conditions TEXT[] DEFAULT '{}',
  medications TEXT[] DEFAULT '{}',
  avatar TEXT DEFAULT '👤',
  health_score INTEGER DEFAULT 90,
  risk TEXT DEFAULT 'Low'
);

-- 7. Create Todos Demo Table (requested for /todos page verification)
CREATE TABLE IF NOT EXISTS public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT false
);

-- 8. Enable Row Level Security (RLS) or Insert mock data for verification
INSERT INTO public.todos (name) VALUES 
('Install Supabase SSR packages'),
('Configure environment variables'),
('Initialize PostgreSQL tables')
ON CONFLICT DO NOTHING;
