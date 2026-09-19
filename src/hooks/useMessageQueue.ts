import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PendingMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: 'text' | 'voice' | 'heartbeat';
  voice_url?: string;
  created_at: string;
  status: 'pending' | 'sending' | 'failed';
  retryCount: number;
}

const DB_NAME = 'loveChat';
const STORE_NAME = 'pendingMessages';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

const savePendingMessage = async (message: PendingMessage): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(message);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const getPendingMessages = async (): Promise<PendingMessage[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

const removePendingMessage = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

const updateMessageStatus = async (id: string, status: PendingMessage['status'], retryCount?: number): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const message = getRequest.result;
      if (message) {
        message.status = status;
        if (retryCount !== undefined) {
          message.retryCount = retryCount;
        }
        store.put(message);
      }
      resolve();
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Helper to determine sender label based on user ID
const getSenderLabel = (userId: string): string => {
  if (userId === '00000000-0000-0000-0000-000000000001') return 'he';
  if (userId === '00000000-0000-0000-0000-000000000002') return 'she';
  return 'user';
};

const sendMessageToSupabase = async (message: PendingMessage): Promise<boolean> => {
  try {
    const { error } = await supabase.from('messages').insert({
      sender: getSenderLabel(message.sender_id),
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
      content: message.content,
      message_type: message.message_type,
      voice_url: message.voice_url,
    });
    
    if (error) {
      console.error('Error sending message:', error);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

export const useMessageQueue = (currentUserId: string | null, chatPartnerId: string | null) => {
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    if (!currentUserId || !chatPartnerId) return;
    
    const loadPending = async () => {
      const messages = await getPendingMessages();
      setPendingMessages(messages.filter(m => 
        m.sender_id === currentUserId && m.receiver_id === chatPartnerId
      ));
    };
    loadPending();
  }, [currentUserId, chatPartnerId]);

  useEffect(() => {
    if (!currentUserId || !chatPartnerId) return;

    const handleOnline = async () => {
      setIsOnline(true);
      const messages = await getPendingMessages();
      const relevantMessages = messages.filter(m => 
        m.sender_id === currentUserId && m.receiver_id === chatPartnerId
      );
      
      for (const message of relevantMessages) {
        if (message.status !== 'failed' || message.retryCount < 3) {
          const success = await sendMessageToSupabase(message);
          if (success) {
            await removePendingMessage(message.id);
          }
        }
      }
      
      const updatedMessages = await getPendingMessages();
      setPendingMessages(updatedMessages.filter(m => 
        m.sender_id === currentUserId && m.receiver_id === chatPartnerId
      ));
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUserId, chatPartnerId]);

  const queueMessage = useCallback(async (
    content: string, 
    type: 'text' | 'voice' | 'heartbeat' = 'text',
    voiceUrl?: string
  ): Promise<PendingMessage> => {
    if (!currentUserId || !chatPartnerId) throw new Error('No user');

    const message: PendingMessage = {
      id: crypto.randomUUID(),
      sender_id: currentUserId,
      receiver_id: chatPartnerId,
      content,
      message_type: type,
      voice_url: voiceUrl,
      created_at: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    await savePendingMessage(message);
    setPendingMessages(prev => [...prev, message]);

    if (navigator.onLine) {
      await updateMessageStatus(message.id, 'sending');
      setPendingMessages(prev => 
        prev.map(m => m.id === message.id ? { ...m, status: 'sending' } : m)
      );

      const success = await sendMessageToSupabase(message);
      
      if (success) {
        await removePendingMessage(message.id);
        setPendingMessages(prev => prev.filter(m => m.id !== message.id));
      } else {
        await updateMessageStatus(message.id, 'failed', 1);
        setPendingMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, status: 'failed', retryCount: 1 } : m)
        );
      }
    }

    return message;
  }, [currentUserId, chatPartnerId]);

  const retryMessage = useCallback(async (id: string) => {
    const message = pendingMessages.find(m => m.id === id);
    if (!message) return;

    await updateMessageStatus(id, 'sending');
    setPendingMessages(prev => 
      prev.map(m => m.id === id ? { ...m, status: 'sending' } : m)
    );

    const success = await sendMessageToSupabase(message);

    if (success) {
      await removePendingMessage(id);
      setPendingMessages(prev => prev.filter(m => m.id !== id));
    } else {
      const newRetryCount = message.retryCount + 1;
      await updateMessageStatus(id, 'failed', newRetryCount);
      setPendingMessages(prev => 
        prev.map(m => m.id === id ? { ...m, status: 'failed', retryCount: newRetryCount } : m)
      );
    }
  }, [pendingMessages]);

  return {
    pendingMessages,
    isOnline,
    queueMessage,
    retryMessage,
  };
};
