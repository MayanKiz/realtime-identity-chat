import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export const useTypingIndicator = (currentUserId: string | null, otherUserId: string | null) => {
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    const channel = supabase
      .channel(`typing-${currentUserId}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'typing_status' },
        (payload) => {
          const next = payload.new as { id?: string; is_typing?: boolean };
          if (next.id === otherUserId) {
            setOtherTyping(Boolean(next.is_typing));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!currentUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Upsert typing status
    await supabase
      .from('typing_status')
      .upsert({ 
        id: currentUserId, 
        is_typing: isTyping, 
        updated_at: new Date().toISOString() 
      });

    // Auto-stop typing after 3 seconds
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 3000);
    }
  }, [currentUserId]);

  return { otherTyping, setTyping };
};
