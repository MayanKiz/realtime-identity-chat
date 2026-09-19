-- Create users table for secret identities
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname text NOT NULL,
  login_pin text NOT NULL UNIQUE,
  connection_pin text NOT NULL,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all operations on users (no auth required for this secret chat app)
CREATE POLICY "Allow all operations on users" ON public.users
FOR ALL USING (true) WITH CHECK (true);

-- Add sender_id and receiver_id to messages for multi-user support
ALTER TABLE public.messages 
ADD COLUMN sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN receiver_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- Insert legacy users for He and She
INSERT INTO public.users (id, nickname, login_pin, connection_pin, is_online, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'He', '050108', '2580', false, now()),
  ('00000000-0000-0000-0000-000000000002', 'She', '100409', '2580', false, now());

-- Update existing messages to link to legacy users
UPDATE public.messages 
SET sender_id = CASE 
  WHEN sender = 'he' THEN '00000000-0000-0000-0000-000000000001'::uuid
  WHEN sender = 'she' THEN '00000000-0000-0000-0000-000000000002'::uuid
END,
receiver_id = CASE 
  WHEN sender = 'he' THEN '00000000-0000-0000-0000-000000000002'::uuid
  WHEN sender = 'she' THEN '00000000-0000-0000-0000-000000000001'::uuid
END;

-- Enable realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;