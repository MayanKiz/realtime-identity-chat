-- Create messages table for real-time chat
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender TEXT NOT NULL CHECK (sender IN ('he', 'she')),
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'heartbeat')),
  voice_url TEXT,
  reactions JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create typing indicators table
CREATE TABLE public.typing_status (
  id TEXT PRIMARY KEY CHECK (id IN ('he', 'she')),
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table for wallpaper
CREATE TABLE public.chat_settings (
  id TEXT PRIMARY KEY CHECK (id IN ('he', 'she')),
  wallpaper_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default typing status rows
INSERT INTO public.typing_status (id, is_typing) VALUES ('he', false), ('she', false);

-- Insert default settings rows
INSERT INTO public.chat_settings (id) VALUES ('he'), ('she');

-- Enable RLS but allow all operations (private app, PIN protected)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;

-- Public policies for this private 2-person app (PIN protection is the security layer)
CREATE POLICY "Allow all operations on messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on typing_status" ON public.typing_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_settings" ON public.chat_settings FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime for messages and typing
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;