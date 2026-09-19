import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface PresenceEvent {
  type: 'join' | 'leave';
  userId: string;
  nickname: string;
  timestamp: number;
}

export const usePresence = (currentUserId: string, currentNickname: string, otherUserId: string, otherNickname: string) => {
  const [presenceEvents, setPresenceEvents] = useState<PresenceEvent[]>([]);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  
  const addEvent = useCallback((event: PresenceEvent) => {
    setPresenceEvents(prev => {
      const newEvents = [...prev, event];
      return newEvents.slice(-5);
    });
    
    setTimeout(() => {
      setPresenceEvents(prev => prev.filter(e => e.timestamp !== event.timestamp));
    }, 4000);
  }, []);

  useEffect(() => {
    const roomKey = [currentUserId, otherUserId].sort().join('-');
    
    const channel = supabase.channel(`presence-${roomKey}`, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        setIsOtherOnline(!!state[otherUserId]?.length);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === otherUserId) {
          setIsOtherOnline(true);
          addEvent({
            type: 'join',
            userId: otherUserId,
            nickname: otherNickname,
            timestamp: Date.now(),
          });
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === otherUserId) {
          setIsOtherOnline(false);
          addEvent({
            type: 'leave',
            userId: otherUserId,
            nickname: otherNickname,
            timestamp: Date.now(),
          });
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: currentUserId,
            nickname: currentNickname,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, currentNickname, otherNickname, addEvent]);

  const dismissEvent = useCallback((timestamp: number) => {
    setPresenceEvents(prev => prev.filter(e => e.timestamp !== timestamp));
  }, []);

  return {
    presenceEvents,
    isOtherOnline,
    dismissEvent,
  };
};
