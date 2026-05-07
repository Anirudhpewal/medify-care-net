
-- Roles enum & user_roles table (security best practice)
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'admin');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Shared profile
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  photo_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles: view own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Patients
CREATE TABLE public.patients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_code TEXT NOT NULL UNIQUE,
  date_of_birth DATE NOT NULL,
  gender TEXT NOT NULL,
  blood_group TEXT,
  aadhaar_full TEXT,
  aadhaar_last4 TEXT,
  state_code TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  city TEXT,
  pincode TEXT,
  address_line TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients: view own" ON public.patients FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Patients: insert own" ON public.patients FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Patients: update own" ON public.patients FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Hospitals (public read)
CREATE TABLE public.hospitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hospital_type TEXT NOT NULL,
  state TEXT NOT NULL,
  district TEXT,
  city TEXT,
  pincode TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  specialities TEXT[] DEFAULT '{}',
  facilities TEXT[] DEFAULT '{}',
  insurance_panels TEXT[] DEFAULT '{}',
  beds_general INT DEFAULT 0,
  beds_icu INT DEFAULT 0,
  beds_nicu INT DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INT DEFAULT 0,
  photo_url TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospitals: public read" ON public.hospitals FOR SELECT TO anon, authenticated USING (true);

-- Doctors
CREATE TABLE public.doctors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  doctor_code TEXT NOT NULL UNIQUE,
  specialization TEXT NOT NULL,
  qualification TEXT NOT NULL,
  council_reg_number TEXT NOT NULL,
  hospital_id UUID REFERENCES public.hospitals(id),
  experience_years INT DEFAULT 0,
  consultation_fee NUMERIC(10,2) DEFAULT 0,
  languages TEXT[] DEFAULT '{}',
  opd_days TEXT[] DEFAULT '{}',
  opd_start_time TIME,
  opd_end_time TIME,
  bio TEXT,
  rating NUMERIC(2,1) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors: public read" ON public.doctors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Doctors: insert own" ON public.doctors FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Doctors: update own" ON public.doctors FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Hospital admins
CREATE TABLE public.hospital_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
  designation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hospital_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hospital admins: view own" ON public.hospital_admins FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Hospital admins: insert own" ON public.hospital_admins FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Patient code generator (HF-XX-YYYY-NNNNNN)
CREATE OR REPLACE FUNCTION public.generate_patient_code(_state_code TEXT)
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _year TEXT := EXTRACT(YEAR FROM now())::TEXT;
  _seq TEXT;
BEGIN
  _seq := LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN 'HF-' || UPPER(_state_code) || '-' || _year || '-' || _seq;
END;
$$;

-- Doctor code generator
CREATE OR REPLACE FUNCTION public.generate_doctor_code()
RETURNS TEXT LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _year TEXT := EXTRACT(YEAR FROM now())::TEXT;
BEGIN
  RETURN 'HF-DR-' || _year || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
END;
$$;

-- Auto profile insert on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed a few hospitals
INSERT INTO public.hospitals (name, hospital_type, state, district, city, pincode, specialities, facilities, insurance_panels, beds_general, beds_icu, beds_nicu, rating, review_count, phone)
VALUES
  ('AIIMS Delhi', 'Government', 'Delhi', 'New Delhi', 'New Delhi', '110029',
   ARRAY['Cardiology','Oncology','Neurology','Orthopedics'],
   ARRAY['ICU','NICU','MRI','CT Scan','Blood Bank','24x7 Emergency','Ambulance','Pharmacy','Dialysis'],
   ARRAY['Ayushman Bharat','CGHS','ECHS'], 200, 40, 20, 4.7, 1240, '+91-11-26588500'),
  ('Apollo Hospitals Chennai', 'Private', 'Tamil Nadu', 'Chennai', 'Chennai', '600006',
   ARRAY['Cardiology','Oncology','Gynecology','Pediatrics'],
   ARRAY['ICU','NICU','MRI','CT Scan','Blood Bank','24x7 Emergency','Ambulance','Pharmacy'],
   ARRAY['CGHS','Private Insurance'], 350, 60, 30, 4.6, 980, '+91-44-28290200'),
  ('Tata Memorial Mumbai', 'Trust', 'Maharashtra', 'Mumbai', 'Mumbai', '400012',
   ARRAY['Oncology','Radiology'],
   ARRAY['ICU','MRI','CT Scan','Radiation Oncology','Blood Bank','24x7 Emergency','Pharmacy'],
   ARRAY['Ayushman Bharat','State Health Scheme'], 180, 35, 0, 4.8, 1530, '+91-22-24177000'),
  ('Manipal Bangalore', 'Private', 'Karnataka', 'Bengaluru Urban', 'Bengaluru', '560017',
   ARRAY['Cardiology','Neurology','Orthopedics','Pediatrics'],
   ARRAY['ICU','NICU','MRI','CT Scan','Blood Bank','24x7 Emergency','Ambulance','Pharmacy','Dialysis'],
   ARRAY['CGHS','Private Insurance'], 280, 50, 25, 4.5, 720, '+91-80-25023344'),
  ('NIMHANS Bengaluru', 'Government', 'Karnataka', 'Bengaluru Urban', 'Bengaluru', '560029',
   ARRAY['Neurology','Psychiatry'],
   ARRAY['ICU','MRI','CT Scan','24x7 Emergency'],
   ARRAY['Ayushman Bharat','CGHS','State Health Scheme'], 150, 25, 0, 4.6, 540, '+91-80-26995000'),
  ('Fortis Kolkata', 'Private', 'West Bengal', 'Kolkata', 'Kolkata', '700107',
   ARRAY['Cardiology','Orthopedics','Gynecology'],
   ARRAY['ICU','NICU','MRI','Blood Bank','24x7 Emergency','Ambulance','Pharmacy'],
   ARRAY['CGHS','Private Insurance'], 220, 40, 20, 4.4, 410, '+91-33-66284444');
