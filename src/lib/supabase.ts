import { supabase } from "@/integrations/supabase/client";

export { supabase };

export type User = {
  id: string;
  nickname: string;
  rank?: 'Leader' | 'Guardian' | 'Member' | 'Newcomer';
  login_pin: string;
  connection_pin: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
};

export type Message = {
  id: string;
  sender: 'he' | 'she';
  content: string | null;
  message_type: 'text' | 'voice' | 'heartbeat';
  voice_url: string | null;
  reactions: string[];
  is_read: boolean;
  created_at: string;
  sender_id: string | null;
  receiver_id: string | null;
};

export type TypingStatus = {
  id: string;
  is_typing: boolean;
  updated_at: string;
};

export type ChatSettings = {
  id: string;
  wallpaper_url: string | null;
  updated_at: string;
};
