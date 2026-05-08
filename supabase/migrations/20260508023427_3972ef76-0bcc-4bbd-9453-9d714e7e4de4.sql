
-- Remove FK constraints to auth.users so we can seed records and let the demo seed function manage demo accounts
ALTER TABLE public.doctors DROP CONSTRAINT IF EXISTS doctors_id_fkey;
ALTER TABLE public.patients DROP CONSTRAINT IF EXISTS patients_id_fkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.hospital_admins DROP CONSTRAINT IF EXISTS hospital_admins_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- New tables
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  hospital_id uuid,
  diagnosis text NOT NULL,
  status text NOT NULL DEFAULT 'Under Treatment',
  progress integer NOT NULL DEFAULT 0,
  started_at date DEFAULT CURRENT_DATE,
  last_visit date,
  next_appointment date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Treatments: patient view own" ON public.treatments FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Treatments: doctor view assigned" ON public.treatments FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Treatments: admin view all" ON public.treatments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Treatments: doctor manage" ON public.treatments FOR ALL TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  hospital_id uuid,
  scheduled_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Appt: patient view own" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Appt: doctor view assigned" ON public.appointments FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Appt: admin view all" ON public.appointments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Appt: patient create own" ON public.appointments FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);

CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id uuid,
  patient_id uuid NOT NULL,
  doctor_id uuid,
  medicine_name text NOT NULL,
  dosage text,
  frequency text,
  instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Rx: patient view own" ON public.prescriptions FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Rx: doctor view assigned" ON public.prescriptions FOR SELECT TO authenticated USING (auth.uid() = doctor_id);
CREATE POLICY "Rx: admin view all" ON public.prescriptions FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Rx: doctor manage" ON public.prescriptions FOR ALL TO authenticated USING (auth.uid() = doctor_id) WITH CHECK (auth.uid() = doctor_id);

CREATE TABLE public.lab_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  name text NOT NULL,
  result text,
  status text DEFAULT 'ready',
  report_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lab: patient view own" ON public.lab_reports FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Lab: admin view all" ON public.lab_reports FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  amount numeric NOT NULL,
  method text,
  description text,
  paid_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pay: patient view own" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "Pay: admin view all" ON public.payments FOR SELECT TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notif: view own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Notif: update own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Allow user_roles inserts by user (used by signup flow)
DROP POLICY IF EXISTS "Roles: insert own" ON public.user_roles;
CREATE POLICY "Roles: insert own" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Seed Hospitals
INSERT INTO public.hospitals (name, hospital_type, state, district, city, phone, email, beds_general, beds_icu, beds_nicu, rating, specialities, insurance_panels) VALUES
('AIIMS New Delhi','Government','Delhi','New Delhi','New Delhi','011-26588500','info@aiims.edu',2500,300,0,4.9,ARRAY['Cardiology','Neurology','Oncology','Transplant','Orthopedics'],ARRAY['Ayushman Bharat','CGHS','ECHS']),
('AIIMS Narnaul','Government','Haryana','Narnaul','Narnaul','01282-256001','aiims.narnaul@gov.in',500,40,10,4.8,ARRAY['Cardiology','Neurology','Orthopedics','Gynecology'],ARRAY['Ayushman Bharat','CGHS','ECHS']),
('Medanta The Medicity','Private','Haryana','Gurugram','Gurugram','0124-4141414','info@medanta.org',1250,150,30,4.9,ARRAY['Cardiology','Neurosurgery','Oncology','Transplant','Robotic Surgery'],ARRAY['CGHS','Star Health','HDFC Ergo','Bajaj Allianz']),
('Safdarjung Hospital','Government','Delhi','New Delhi','New Delhi','011-26165060','info@safdarjunghospital.in',1531,120,25,4.5,ARRAY['General Medicine','Surgery','Gynecology','Pediatrics','Orthopedics'],ARRAY['Ayushman Bharat','CGHS','ECHS']),
('Apollo Hospital Chennai','Private','Tamil Nadu','Chennai','Chennai','044-28296000','apollo.chennai@apollohospitals.com',750,100,20,4.9,ARRAY['Cardiology','Oncology','Transplant','Neurology','Robotic Surgery'],ARRAY['Ayushman Bharat','Star Health','HDFC Ergo']),
('Civil Hospital Amritsar','Government','Punjab','Amritsar','Amritsar','0183-2561771','civil.amritsar@punjab.gov.in',800,60,15,4.2,ARRAY['General Medicine','Surgery','Gynecology','Orthopedics','Pediatrics'],ARRAY['Ayushman Bharat','CGHS','Punjab State Scheme']),
('Kokilaben Dhirubhai Ambani Hospital','Private','Maharashtra','Mumbai','Mumbai','022-30999999','info@kokilabenhospital.com',750,110,22,4.8,ARRAY['Oncology','Cardiology','Neurology','Transplant','Robotic Surgery'],ARRAY['CGHS','Star Health','HDFC Ergo','Bajaj Allianz']),
('SMS Hospital Jaipur','Government','Rajasthan','Jaipur','Jaipur','0141-2518501','sms@rajasthan.gov.in',2000,150,30,4.4,ARRAY['Cardiology','Neurology','Orthopedics','Burns','Oncology'],ARRAY['Ayushman Bharat','CGHS','Chiranjeevi Yojana']),
('Manipal Hospital Bengaluru','Private','Karnataka','Bengaluru','Bengaluru','080-25024444','info@manipalhospitals.com',600,80,18,4.7,ARRAY['Cardiology','Orthopedics','Neurology','Oncology','Robotic Surgery'],ARRAY['Ayushman Bharat','Star Health','Manipal Cigna']),
('PGIMER Chandigarh','Government','Punjab','Chandigarh','Chandigarh','0172-2756565','info@pgimer.edu.in',1822,180,35,4.8,ARRAY['Cardiology','Neurology','Nephrology','Oncology','Pediatrics'],ARRAY['Ayushman Bharat','CGHS','ECHS']),
('Christian Medical College Vellore','Trust','Tamil Nadu','Vellore','Vellore','0416-2281000','info@cmch-vellore.edu',2700,200,40,4.9,ARRAY['Cardiology','Neurology','Oncology','Transplant','Ophthalmology'],ARRAY['Ayushman Bharat','CGHS','Star Health']),
('Fortis Hospital Noida','Private','Uttar Pradesh','Noida','Noida','0120-4277777','fortis.noida@fortishealthcare.com',400,60,12,4.6,ARRAY['Cardiology','Orthopedics','Neurology','Oncology'],ARRAY['CGHS','Star Health','HDFC Ergo']),
('KEM Hospital Mumbai','Government','Maharashtra','Mumbai','Mumbai','022-24107000','kem@municipal.org',1800,140,28,4.5,ARRAY['General Medicine','Surgery','Gynecology','Pediatrics','Trauma'],ARRAY['Ayushman Bharat','CGHS','Maharashtra State Scheme']),
('Tata Memorial Hospital','Government','Maharashtra','Mumbai','Mumbai','022-24177000','info@tmc.gov.in',629,80,0,4.9,ARRAY['Oncology','Radiation Therapy','Surgical Oncology','Pediatric Oncology'],ARRAY['Ayushman Bharat','CGHS']),
('Rajiv Gandhi Government General Hospital','Government','Tamil Nadu','Chennai','Chennai','044-25305000','rggh@tn.gov.in',2620,160,32,4.3,ARRAY['General Medicine','Surgery','Neurology','Cardiology','Orthopedics'],ARRAY['Ayushman Bharat','Tamil Nadu Chief Minister Scheme']),
('Amrita Institute of Medical Sciences','Private','Kerala','Kochi','Kochi','0484-2801234','info@aims.amrita.edu',1350,140,28,4.8,ARRAY['Cardiology','Neurology','Oncology','Transplant','Robotic Surgery'],ARRAY['Ayushman Bharat','CGHS','Star Health']),
('Sir Ganga Ram Hospital','Private','Delhi','New Delhi','New Delhi','011-25750000','info@sgrh.com',675,90,18,4.7,ARRAY['Cardiology','Neurology','Orthopedics','Gastroenterology','Endocrinology'],ARRAY['CGHS','Star Health','HDFC Ergo','New India']),
('NIMHANS Bengaluru','Government','Karnataka','Bengaluru','Bengaluru','080-46110007','info@nimhans.ac.in',930,60,0,4.8,ARRAY['Psychiatry','Neurology','Neurosurgery','Clinical Psychology'],ARRAY['Ayushman Bharat','CGHS']),
('Lilavati Hospital Mumbai','Private','Maharashtra','Mumbai','Mumbai','022-26751000','info@lilavatihospital.com',323,55,10,4.7,ARRAY['Cardiology','Oncology','Orthopedics','Neurology','Dermatology'],ARRAY['CGHS','Star Health','Bajaj Allianz','HDFC Ergo']),
('Ruby Hall Clinic Pune','Private','Maharashtra','Pune','Pune','020-26163391','info@rubyhall.com',450,70,14,4.6,ARRAY['Cardiology','Neurology','Orthopedics','Oncology','Nephrology'],ARRAY['CGHS','Star Health','HDFC Ergo']),
('JIPMER Puducherry','Government','Puducherry','Puducherry','Puducherry','0413-2272380','info@jipmer.edu.in',1758,130,26,4.7,ARRAY['Cardiology','Neurology','Endocrinology','Oncology','Pediatrics'],ARRAY['Ayushman Bharat','CGHS','ECHS']),
('Narayana Health Bengaluru','Private','Karnataka','Bengaluru','Bengaluru','080-71222222','info@narayanahealth.org',1000,120,24,4.8,ARRAY['Cardiology','Cardiac Surgery','Oncology','Transplant','Pediatric Cardiac'],ARRAY['Ayushman Bharat','CGHS','Star Health']),
('Max Super Speciality Hospital Delhi','Private','Delhi','Saket','New Delhi','011-26515050','max.saket@maxhealthcare.com',500,85,16,4.7,ARRAY['Cardiology','Oncology','Neurology','Bone Marrow Transplant'],ARRAY['CGHS','ECHS','Star Health','HDFC Ergo']),
('Sawai Man Singh Hospital','Government','Rajasthan','Jaipur','Jaipur','0141-2518501','sms2@rajasthan.gov.in',2500,180,36,4.4,ARRAY['General Medicine','Surgery','Oncology','Neurology','Pediatrics'],ARRAY['Ayushman Bharat','Chiranjeevi Yojana','CGHS']),
('Deen Dayal Upadhyay Hospital','Government','Delhi','New Delhi','New Delhi','011-25455450','ddu@delhi.gov.in',1500,100,20,4.3,ARRAY['General Medicine','Surgery','Gynecology','Orthopedics','Pediatrics'],ARRAY['Ayushman Bharat','CGHS']),
('Indira Gandhi Medical College Hospital','Government','Himachal Pradesh','Shimla','Shimla','0177-2880205','igmc.shimla@hp.gov.in',1130,85,17,4.4,ARRAY['General Medicine','Surgery','Cardiology','Neurology','Orthopedics'],ARRAY['Ayushman Bharat','CGHS','HIMCARE']),
('Postgraduate Institute Lucknow (SGPGI)','Government','Uttar Pradesh','Lucknow','Lucknow','0522-2668700','info@sgpgi.ac.in',1680,150,30,4.7,ARRAY['Cardiology','Nephrology','Neurology','Endocrinology','Gastroenterology'],ARRAY['Ayushman Bharat','CGHS','UP State Scheme']),
('Aakash Healthcare Delhi','Private','Delhi','Dwarka','New Delhi','011-45555555','info@aakashhealthcare.com',350,55,11,4.5,ARRAY['Cardiology','Orthopedics','Neurology','Gynecology','Pediatrics'],ARRAY['CGHS','Star Health','HDFC Ergo']),
('SRM Institutes for Medical Science','Private','Tamil Nadu','Chennai','Chennai','044-27417777','info@srmhospitals.com',480,65,13,4.5,ARRAY['Cardiology','Neurology','Oncology','Transplant','Orthopedics'],ARRAY['Ayushman Bharat','Star Health','New India']),
('Kalawati Saran Children Hospital','Government','Delhi','New Delhi','New Delhi','011-23365525','kalawati@delhi.gov.in',503,70,40,4.6,ARRAY['Pediatrics','Pediatric Surgery','Neonatology','Pediatric Cardiology','Child Psychiatry'],ARRAY['Ayushman Bharat','CGHS'])
ON CONFLICT DO NOTHING;

-- Seed Doctors
DO $$
DECLARE
  h_aiims_del uuid; h_aiims_nar uuid; h_medanta uuid; h_safdar uuid; h_apollo uuid;
  h_civil_amr uuid; h_kokilaben uuid; h_sms uuid; h_manipal uuid;
BEGIN
  SELECT id INTO h_aiims_del FROM public.hospitals WHERE name='AIIMS New Delhi' LIMIT 1;
  SELECT id INTO h_aiims_nar FROM public.hospitals WHERE name='AIIMS Narnaul' LIMIT 1;
  SELECT id INTO h_medanta FROM public.hospitals WHERE name='Medanta The Medicity' LIMIT 1;
  SELECT id INTO h_safdar FROM public.hospitals WHERE name='Safdarjung Hospital' LIMIT 1;
  SELECT id INTO h_apollo FROM public.hospitals WHERE name='Apollo Hospital Chennai' LIMIT 1;
  SELECT id INTO h_civil_amr FROM public.hospitals WHERE name='Civil Hospital Amritsar' LIMIT 1;
  SELECT id INTO h_kokilaben FROM public.hospitals WHERE name='Kokilaben Dhirubhai Ambani Hospital' LIMIT 1;
  SELECT id INTO h_sms FROM public.hospitals WHERE name='SMS Hospital Jaipur' LIMIT 1;
  SELECT id INTO h_manipal FROM public.hospitals WHERE name='Manipal Hospital Bengaluru' LIMIT 1;

  INSERT INTO public.doctors (id, doctor_code, specialization, qualification, council_reg_number, experience_years, consultation_fee, languages, opd_days, opd_start_time, opd_end_time, rating, hospital_id, bio) VALUES
  (gen_random_uuid(),'HF-DR-2026-100001','Cardiology','MBBS MD DM Cardiology','MCI-100001',28,1000,ARRAY['Hindi','English'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.9,h_aiims_del,'Dr. Rajesh Bhan'),
  (gen_random_uuid(),'HF-DR-2026-100002','Neurology','MBBS MD DM Neurology','MCI-100002',22,1000,ARRAY['Hindi','English','Urdu'],ARRAY['Tue','Thu','Sat'],'10:00','14:00',4.8,h_aiims_del,'Dr. Farida Haidari'),
  (gen_random_uuid(),'HF-DR-2026-100003','Oncology','MBBS MD DM Oncology','MCI-100003',25,1200,ARRAY['Hindi','Punjabi','English'],ARRAY['Mon','Tue','Wed'],'09:00','12:00',4.8,h_aiims_del,'Dr. Tejinder Singh Gill'),
  (gen_random_uuid(),'HF-DR-2026-100004','Gynecology','MBBS MS Gynecology','MCI-100004',20,800,ARRAY['Hindi','English'],ARRAY['Mon','Tue','Wed','Thu','Fri'],'08:00','12:00',4.7,h_aiims_del,'Dr. Sunita Mathur'),
  (gen_random_uuid(),'HF-DR-2026-100005','Orthopedics','MBBS MS Orthopedics DNB','MCI-100005',18,900,ARRAY['Hindi','English','Malayalam'],ARRAY['Tue','Thu'],'09:00','13:00',4.7,h_aiims_del,'Dr. Joseph Kurien'),
  (gen_random_uuid(),'HF-DR-2026-100006','Cardiology','MBBS MD DM Cardiology','MCI-100006',18,800,ARRAY['Hindi','English'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.9,h_aiims_nar,'Dr. Aarav Sharma'),
  (gen_random_uuid(),'HF-DR-2026-100008','Gynecology','MBBS MS Gynecology','MCI-100008',14,600,ARRAY['Hindi','Urdu','English'],ARRAY['Tue','Thu','Sat'],'10:00','14:00',4.7,h_aiims_nar,'Dr. Nasreen Ansari'),
  (gen_random_uuid(),'HF-DR-2026-100009','Pediatrics','MBBS MD Pediatrics','MCI-100009',10,500,ARRAY['Hindi','Punjabi','English'],ARRAY['Mon','Wed','Fri'],'08:00','12:00',4.8,h_aiims_nar,'Dr. Balvinder Kaur'),
  (gen_random_uuid(),'HF-DR-2026-100010','Orthopedics','MBBS MS Orthopedics','MCI-100010',16,600,ARRAY['Hindi','English'],ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'],'09:00','11:00',4.6,h_aiims_nar,'Dr. Suresh Chand Verma'),
  (gen_random_uuid(),'HF-DR-2026-100011','Neurosurgery','MBBS MS MCh Neurosurgery','MCI-100011',22,1500,ARRAY['Hindi','English','Urdu'],ARRAY['Tue','Thu','Sat'],'10:00','14:00',4.8,h_medanta,'Dr. Imran Khan'),
  (gen_random_uuid(),'HF-DR-2026-100012','Cardiology','MBBS MD DM Cardiology','MCI-100012',19,1800,ARRAY['Malayalam','Tamil','English','Hindi'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.9,h_medanta,'Dr. Preethi Nambiar'),
  (gen_random_uuid(),'HF-DR-2026-100013','Oncology','MBBS MD DM Oncology','MCI-100013',21,2000,ARRAY['Punjabi','Hindi','English'],ARRAY['Mon','Tue'],'10:00','14:00',4.8,h_medanta,'Dr. Harjot Singh Chawla'),
  (gen_random_uuid(),'HF-DR-2026-100014','Transplant Surgery','MBBS MS MCh','MCI-100014',24,2500,ARRAY['Malayalam','English','Hindi'],ARRAY['Wed','Fri'],'11:00','15:00',4.9,h_medanta,'Dr. Mary Thomas'),
  (gen_random_uuid(),'HF-DR-2026-100015','Gastroenterology','MBBS MD DM','MCI-100015',17,1400,ARRAY['Hindi','English'],ARRAY['Thu','Sat'],'09:00','13:00',4.7,h_medanta,'Dr. Vinod Kumar Saxena'),
  (gen_random_uuid(),'HF-DR-2026-100016','Gynecology','MBBS MS Gynecology DNB','MCI-100016',16,1200,ARRAY['Tamil','English','Hindi'],ARRAY['Mon','Tue','Wed','Thu','Fri'],'10:00','14:00',4.8,h_apollo,'Dr. Priya Nair'),
  (gen_random_uuid(),'HF-DR-2026-100017','Cardiology','MBBS MD DM Cardiology','MCI-100017',23,1500,ARRAY['Tamil','English'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.9,h_apollo,'Dr. Anand Krishnamurthy'),
  (gen_random_uuid(),'HF-DR-2026-100018','Oncology','MBBS MD DM Oncology','MCI-100018',20,1800,ARRAY['Tamil','Urdu','Hindi','English'],ARRAY['Tue','Thu'],'10:00','14:00',4.8,h_apollo,'Dr. Zubair Ahmed'),
  (gen_random_uuid(),'HF-DR-2026-100019','Neurology','MBBS MD DM Neurology','MCI-100019',15,1200,ARRAY['Tamil','English'],ARRAY['Mon','Tue','Thu'],'09:00','13:00',4.7,h_apollo,'Dr. Kavitha Subramaniam'),
  (gen_random_uuid(),'HF-DR-2026-100020','Orthopedics','MBBS MS DNB','MCI-100020',18,1300,ARRAY['Tamil','English','Hindi'],ARRAY['Wed','Fri','Sat'],'09:00','13:00',4.7,h_apollo,'Dr. Robert D''Cruz'),
  (gen_random_uuid(),'HF-DR-2026-100021','Orthopedics','MBBS MS DNB','MCI-100021',15,500,ARRAY['Punjabi','Hindi','English'],ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'],'08:00','12:00',4.7,h_civil_amr,'Dr. Gurpreet Singh'),
  (gen_random_uuid(),'HF-DR-2026-100022','Gynecology','MBBS MS Gynecology','MCI-100022',12,400,ARRAY['Punjabi','Hindi','Urdu'],ARRAY['Tue','Thu','Sat'],'09:00','13:00',4.6,h_civil_amr,'Dr. Rubina Bano'),
  (gen_random_uuid(),'HF-DR-2026-100023','Pediatrics','MBBS MD Pediatrics','MCI-100023',14,400,ARRAY['Punjabi','Hindi','English'],ARRAY['Mon','Wed','Fri'],'08:00','12:00',4.7,h_civil_amr,'Dr. Manjit Kaur Dhaliwal'),
  (gen_random_uuid(),'HF-DR-2026-100024','General Medicine','MBBS MD','MCI-100024',11,350,ARRAY['Punjabi','Hindi','English'],ARRAY['Mon','Tue','Wed','Thu','Fri'],'09:00','11:00',4.5,h_civil_amr,'Dr. Prabhjot Arora'),
  (gen_random_uuid(),'HF-DR-2026-100025','General Surgery','MBBS MS','MCI-100025',17,450,ARRAY['English','Hindi','Punjabi'],ARRAY['Mon','Wed'],'09:00','13:00',4.6,h_civil_amr,'Dr. Francis Xavier'),
  (gen_random_uuid(),'HF-DR-2026-100026','Oncology','MBBS MD DM Oncology','MCI-100026',20,2000,ARRAY['English','Hindi','Marathi'],ARRAY['Mon','Wed','Fri'],'11:00','15:00',4.9,h_kokilaben,'Dr. Maria D''Souza'),
  (gen_random_uuid(),'HF-DR-2026-100027','Dermatology','MBBS MD Dermatology','MCI-100027',11,1800,ARRAY['Urdu','Hindi','Marathi','English'],ARRAY['Wed','Fri'],'14:00','18:00',4.7,h_kokilaben,'Dr. Fatima Sheikh'),
  (gen_random_uuid(),'HF-DR-2026-100028','Cardiology','MBBS MD DM Cardiology','MCI-100028',24,2200,ARRAY['Marathi','Tamil','Hindi','English'],ARRAY['Mon','Tue','Thu'],'09:00','13:00',4.8,h_kokilaben,'Dr. Ramesh Iyer'),
  (gen_random_uuid(),'HF-DR-2026-100029','Neurosurgery','MBBS MS MCh','MCI-100029',19,2500,ARRAY['Punjabi','Hindi','English'],ARRAY['Tue','Fri'],'10:00','14:00',4.8,h_kokilaben,'Dr. Gurdeep Walia'),
  (gen_random_uuid(),'HF-DR-2026-100030','Gynecology','MBBS MS DNB','MCI-100030',16,1600,ARRAY['Gujarati','Marathi','Hindi','English'],ARRAY['Mon','Thu'],'09:00','13:00',4.7,h_kokilaben,'Dr. Anjali Mehta'),
  (gen_random_uuid(),'HF-DR-2026-100031','Cardiology','MBBS MD DM Cardiology','MCI-100031',25,600,ARRAY['Hindi','English','Rajasthani'],ARRAY['Mon','Wed','Fri'],'08:00','12:00',4.7,h_sms,'Dr. Rajesh Verma'),
  (gen_random_uuid(),'HF-DR-2026-100032','Neurology','MBBS MD DM Neurology','MCI-100032',18,550,ARRAY['Hindi','Urdu','English'],ARRAY['Tue','Thu','Sat'],'09:00','13:00',4.6,h_sms,'Dr. Salma Qureshi'),
  (gen_random_uuid(),'HF-DR-2026-100033','Orthopedics','MBBS MS DNB','MCI-100033',20,600,ARRAY['Hindi','Rajasthani','English'],ARRAY['Mon','Tue','Wed','Thu','Fri'],'08:00','10:00',4.6,h_sms,'Dr. Vikram Singh Rathore'),
  (gen_random_uuid(),'HF-DR-2026-100034','Gynecology','MBBS MS','MCI-100034',14,450,ARRAY['Hindi','Rajasthani','English'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.5,h_sms,'Dr. Pushpa Sharma'),
  (gen_random_uuid(),'HF-DR-2026-100035','Pediatrics','MBBS MD DNB','MCI-100035',14,900,ARRAY['Kannada','Tamil','English','Hindi'],ARRAY['Tue','Thu','Sat'],'09:00','13:00',4.9,h_manipal,'Dr. Ananya Krishnan'),
  (gen_random_uuid(),'HF-DR-2026-100036','Cardiology','MBBS MD DM Cardiology','MCI-100036',21,1200,ARRAY['Urdu','Kannada','English','Hindi'],ARRAY['Mon','Wed','Fri'],'09:00','13:00',4.8,h_manipal,'Dr. Syed Nawaz'),
  (gen_random_uuid(),'HF-DR-2026-100037','Gynecology','MBBS MS Gynecology','MCI-100037',13,800,ARRAY['Kannada','Hindi','English'],ARRAY['Mon','Tue','Thu'],'10:00','14:00',4.7,h_manipal,'Dr. Deepa Bhat'),
  (gen_random_uuid(),'HF-DR-2026-100038','Neurology','MBBS MD DM','MCI-100038',17,1000,ARRAY['Malayalam','Kannada','English'],ARRAY['Wed','Fri'],'09:00','13:00',4.7,h_manipal,'Dr. Paul Mathew'),
  (gen_random_uuid(),'HF-DR-2026-100039','General Surgery','MBBS MS','MCI-100039',19,400,ARRAY['Hindi','Gujarati','English'],ARRAY['Mon','Tue','Wed','Thu','Fri'],'09:00','11:00',4.6,h_safdar,'Dr. Suresh Patel'),
  (gen_random_uuid(),'HF-DR-2026-100040','Gynecology','MBBS MS','MCI-100040',16,350,ARRAY['Hindi','English'],ARRAY['Tue','Thu','Sat'],'08:00','12:00',4.5,h_safdar,'Dr. Neelam Chaudhary'),
  (gen_random_uuid(),'HF-DR-2026-100041','General Medicine','MBBS MD','MCI-100041',20,300,ARRAY['Hindi','Urdu','English'],ARRAY['Mon','Wed','Fri'],'09:00','11:00',4.6,h_safdar,'Dr. Mohd. Iqbal Khan'),
  (gen_random_uuid(),'HF-DR-2026-100042','Pediatrics','MBBS MD','MCI-100042',12,350,ARRAY['Punjabi','Hindi','English'],ARRAY['Tue','Thu'],'09:00','13:00',4.7,h_safdar,'Dr. Simranjit Kaur')
  ON CONFLICT DO NOTHING;
END $$;
