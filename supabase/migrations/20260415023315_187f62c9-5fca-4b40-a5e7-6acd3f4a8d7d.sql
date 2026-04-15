-- Approvals table for governance
CREATE TABLE public.approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  impact TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'simple' CHECK (level IN ('simple', 'priority')),
  category TEXT NOT NULL,
  supporting_data JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'edited')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own approvals" ON public.approvals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own approvals" ON public.approvals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own approvals" ON public.approvals FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON public.approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Chat history table
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chat_history_user ON public.chat_history(user_id, created_at);