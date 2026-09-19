import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message } from '@/lib/supabase';

export const useMessages = (currentUserId: string | null, otherUserId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId || !otherUserId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data as Message[]);
    setLoading(false);
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    if (!currentUserId || !otherUserId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages-${currentUserId}-${otherUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const msg = payload.new as Message;
            // Only add if it's part of this conversation
            if (
              (msg.sender_id === currentUserId && msg.receiver_id === otherUserId) ||
              (msg.sender_id === otherUserId && msg.receiver_id === currentUserId)
            ) {
              setMessages(prev => [...prev, msg]);
              
              // Play notification sound for incoming messages
              if (msg.sender_id !== currentUserId) {
                playNotificationSound();
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => 
              m.id === payload.new.id ? payload.new as Message : m
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, currentUserId, otherUserId]);

  const sendMessage = async (content: string, type: 'text' | 'voice' | 'heartbeat' = 'text', voiceUrl?: string) => {
    if (!currentUserId || !otherUserId) return;

    // Determine sender label based on legacy user IDs
    const getSenderLabel = (userId: string): string => {
      if (userId === '00000000-0000-0000-0000-000000000001') return 'he';
      if (userId === '00000000-0000-0000-0000-000000000002') return 'she';
      return 'user';
    };

    const { error } = await supabase.from('messages').insert({
      sender: getSenderLabel(currentUserId),
      sender_id: currentUserId,
      receiver_id: otherUserId,
      content,
      message_type: type,
      voice_url: voiceUrl,
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const addReaction = async (messageId: string, reaction: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const currentReactions = Array.isArray(message.reactions) ? message.reactions : [];
    const updatedReactions = currentReactions.includes(reaction)
      ? currentReactions.filter(r => r !== reaction)
      : [...currentReactions, reaction];

    const { error } = await supabase
      .from('messages')
      .update({ reactions: updatedReactions })
      .eq('id', messageId);

    if (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const nukeAllMessages = async () => {
    if (!currentUserId || !otherUserId) return false;

    // Delete only messages in this conversation
    const { error } = await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);
    
    if (error) {
      console.error('Error deleting messages:', error);
      return false;
    }
    
    setMessages([]);
    localStorage.removeItem('pending_messages');
    
    return true;
  };

  return {
    messages,
    loading,
    sendMessage,
    addReaction,
    markAsRead,
    nukeAllMessages,
  };
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
    gain.connect(context.destination);
    [659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.06);
      oscillator.stop(context.currentTime + 0.35);
    });
    window.setTimeout(() => void context.close(), 500);
  } catch {
    // Browsers can block audio until the user interacts with the page.
  }
};
