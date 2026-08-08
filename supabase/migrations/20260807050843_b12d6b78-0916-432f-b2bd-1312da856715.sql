-- roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- first signup becomes admin
CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_grant_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_first_admin();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- site settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'The Tax Maestro',
  person text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  tagline text NOT NULL DEFAULT '',
  gstin text NOT NULL DEFAULT '',
  mobile text NOT NULL DEFAULT '',
  landline text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage site settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- service groups
CREATE TABLE public.service_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  icon text NOT NULL DEFAULT 'Sparkles',
  blurb text NOT NULL DEFAULT '',
  items text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_groups TO authenticated;
GRANT ALL ON public.service_groups TO service_role;
ALTER TABLE public.service_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active services" ON public.service_groups FOR SELECT USING (is_active);
CREATE POLICY "Admins manage services" ON public.service_groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER service_groups_updated_at BEFORE UPDATE ON public.service_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- testimonials
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote text NOT NULL,
  author text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active testimonials" ON public.testimonials FOR SELECT USING (is_active);
CREATE POLICY "Admins manage testimonials" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER testimonials_updated_at BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- faqs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.faqs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.faqs TO authenticated;
GRANT ALL ON public.faqs TO service_role;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active faqs" ON public.faqs FOR SELECT USING (is_active);
CREATE POLICY "Admins manage faqs" ON public.faqs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- leads
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  service text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- seed current live content
INSERT INTO public.site_settings (name, person, role, tagline, gstin, mobile, landline, address, hours)
VALUES ('The Tax Maestro', 'Shweta Singh', 'Tax & Financial Consultant', 'Your trust, Our Priority.',
'07FSDPS115291Z8', '7529993681', '011-44128343',
'WZ-182, KH NO.-177/1, Second Floor, Near Palam Gol Chakkar, Palam Dabri Road, New Delhi-110045',
'[{"day":"Monday – Saturday","time":"10:00 AM – 7:30 PM"},{"day":"Sunday","time":"By appointment"}]'::jsonb);

INSERT INTO public.service_groups (title, icon, blurb, items, sort_order) VALUES
('Registrations', 'Building2', 'Get your entity, identity and statutory registrations done right the first time.',
 ARRAY['Digital Signature (DSC)','PAN & TAN','Proprietorship & Firm Registration','Company / LLP Formation','GST Registration & Compliances','Professional Tax Registration & Returns','ESIC & EPFO Registrations & Returns','Shop Act & Labour License','MSME / Udyham Registration','GEM & OEM Registration','ISO Certification','Trademark Registration'], 1),
('Tax & Compliance', 'FileSpreadsheet', 'Accurate filings, timely reminders and clean records through every due date.',
 ARRAY['Income Tax Returns','TDS Compliances','Professional Tax Returns','Filing of Compliances','CLRA Registration'], 2),
('Accounting & Advisory', 'Briefcase', 'Books you can rely on and reports that stand up to bankers and investors.',
 ARRAY['Accounting and Book Keeping','Project Report'], 3),
('Licenses & Certifications', 'ScrollText', 'Sector licences, NGO approvals and startup recognitions handled end to end.',
 ARRAY['FSSAI Registration / Food License','IEC Code or IECGATE Registration','NGO / Trust or Society Registration & Compliances','12A & 80G','FCRA Registration','Darpan & E-Anudhan Registration','CSR-1','Startup India Certificate & 80-IAC Registration'], 4),
('Other Services', 'Sparkles', 'The practical extras clients ask for once the compliance base is covered.',
 ARRAY['PF Withdrawal','Loans & Insurance','General financial documentation support'], 5);

INSERT INTO public.testimonials (quote, author, sort_order) VALUES
('Exceptional knowledge and a level of attention to detail you rarely see. Every query was answered before I even had to follow up — genuinely proactive professionalism.', 'Individual client, New Delhi', 1),
('She secured the best possible financial outcome for us and the service throughout was outstanding. Confident, clear and completely reliable.', 'Business owner, Dwarka', 2),
('Tax and financial planning finally made sense to me. Everything was explained clearly and accessibly, without jargon or pressure.', 'Salaried professional, Palam', 3);

INSERT INTO public.faqs (question, answer, sort_order) VALUES
('Which documents do I need for income tax return filing?', 'For most individuals: PAN, Aadhaar, Form 16 or salary slips, bank statements, interest certificates, investment and insurance proofs, and details of any capital gains or rental income. For businesses we also need books of accounts, GST returns and TDS details. You will receive a short, specific checklist after the first call — nothing generic.', 1),
('How long does GST registration take?', 'Once documents are in order, the application is filed the same day and the GSTIN is usually issued within 3–7 working days, subject to departmental verification. If the officer raises a query, we respond on your behalf and keep you posted at each stage.', 2),
('Can you register a company or LLP for me completely online?', 'Yes. DSC, name approval, incorporation filings, PAN, TAN and post-incorporation compliances are all handled online. Documents can be shared over WhatsApp or email — an office visit is optional, not mandatory.', 3),
('What is the usual turnaround time for filings?', 'Routine returns (ITR, GST, TDS) are prepared within 24–48 hours of receiving complete documents. Registrations and licences depend on the department''s processing time, and you get a realistic timeline upfront.', 4),
('How does the consultation process work?', 'You call or submit the form, we schedule a consultation, understand your situation and share a clear scope with fees and a document checklist. Work begins only after you confirm — with regular status updates until the matter is closed.', 5),
('Do you work with NGOs, trusts and societies?', 'Yes — registration, 12A and 80G approvals, FCRA, Darpan, E-Anudhan, CSR-1 and ongoing annual compliances are a regular part of our practice.', 6);

REVOKE ALL ON FUNCTION public.grant_first_admin() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE ALL ON FUNCTION public.grant_first_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;