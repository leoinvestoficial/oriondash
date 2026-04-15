-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Company DNA table
CREATE TABLE public.company_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT,
  dna_data JSONB NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.company_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own DNA" ON public.company_dna FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own DNA" ON public.company_dna FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own DNA" ON public.company_dna FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_company_dna_updated_at BEFORE UPDATE ON public.company_dna
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_dna_id UUID NOT NULL REFERENCES public.company_dna(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  department TEXT,
  responsibilities TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team members" ON public.team_members 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.company_dna WHERE id = company_dna_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert team members" ON public.team_members 
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.company_dna WHERE id = company_dna_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update team members" ON public.team_members 
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.company_dna WHERE id = company_dna_id AND user_id = auth.uid())
);
CREATE POLICY "Users can delete team members" ON public.team_members 
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.company_dna WHERE id = company_dna_id AND user_id = auth.uid())
);

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();