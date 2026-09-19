import { useEffect, useRef } from 'react';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import PendingMessageBubble from './PendingMessageBubble';
import ChatInput from './ChatInput';
import PresenceNotification from './PresenceNotification';
import { useMessages } from '@/hooks/useMessages';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { usePanicTap } from '@/hooks/usePanicTap';
import { usePresence } from '@/hooks/usePresence';
import { useMessageQueue } from '@/hooks/useMessageQueue';
import { User } from '@/lib/supabase';
import { markMessagesAsRead } from '@/lib/notifications';
import { WifiOff } from 'lucide-react';

interface ChatViewProps { currentUser: User; chatPartner: User; onBack: () => void; }
const ChatView = ({ currentUser, chatPartner, onBack }: ChatViewProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, addReaction, markAsRead, nukeAllMessages } = useMessages(currentUser.id, chatPartner.id);
  const { otherTyping, setTyping } = useTypingIndicator(currentUser.id, chatPartner.id);
  const { presenceEvents, isOtherOnline, dismissEvent } = usePresence(currentUser.id, currentUser.nickname, chatPartner.id, chatPartner.nickname);
  const { pendingMessages, isOnline, queueMessage, retryMessage } = useMessageQueue(currentUser.id, chatPartner.id);
  usePanicTap();
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, pendingMessages]);
  useEffect(() => { const unread = messages.filter((message) => message.sender_id !== currentUser.id && !message.is_read); unread.forEach((message) => markAsRead(message.id)); if (unread.length) markMessagesAsRead(); }, [messages, currentUser.id, markAsRead]);
  return <section className="flex h-[100dvh] min-h-0 flex-col bg-[#fff9fc]"><ChatHeader currentUser={currentUser} chatPartner={chatPartner} otherTyping={otherTyping} isOtherOnline={isOtherOnline} onBack={onBack} />{!isOnline && <div className="flex shrink-0 items-center justify-center gap-2 bg-yellow-soft px-3 py-1.5 text-xs font-semibold text-foreground"><WifiOff className="h-3.5 w-3.5" /> Offline — messages will retry when you are back.</div>}<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"><div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end"><PresenceNotification events={presenceEvents} onDismiss={dismissEvent} />{loading ? <p className="Sample Message">Opening your chat…</p> : messages.length === 0 && pendingMessages.length === 0 ? <div className="m-auto max-w-xs text-center"><div className="mb-4 text-5xl">💌</div><h3 className="font-display text-2xl">Start with a hello</h3><p className="Sample Message">Send a sweet note or tap the heart.</p></div> : <>{messages.map((message) => <MessageBubble key={message.id} message={message} isSent={message.sender_id === currentUser.id} onReaction={addReaction} />)}{pendingMessages.map((message) => <PendingMessageBubble key={message.id} message={message} onRetry={retryMessage} />)}{otherTyping && <div className="bubble-received mb-3 w-fit px-4 py-3"><span className="Sample Message" /><span className="Sample Message" /><span className="Sample Message" /></div>}<div ref={messagesEndRef} /></>}</div></div><ChatInput onSend={(content, type, voiceUrl) => { void queueMessage(content, type, voiceUrl); }} onTyping={setTyping} /></section>;
};
export default ChatView;
