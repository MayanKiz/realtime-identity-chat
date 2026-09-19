import { useState } from 'react';
import { Send, Mic, Heart } from 'lucide-react';
import { useLoveRain } from '@/hooks/useLoveRain';

interface ChatInputProps { onSend: (content: string, type: 'text' | 'voice' | 'heartbeat', voiceUrl?: string) => void; onTyping: (isTyping: boolean) => void; }
const ChatInput = ({ onSend, onTyping }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const { triggerLoveRain, checkForLoveKeywords } = useLoveRain();
  const send = () => { if (!message.trim()) return; if (checkForLoveKeywords(message)) triggerLoveRain(); onSend(message.trim(), 'text'); setMessage(''); onTyping(false); };
  return <footer className="shrink-0 border-t border-border bg-white px-3 pt-2 safe-bottom"><div className="mx-auto flex max-w-3xl items-end gap-2"><button onClick={() => { onSend('💓', 'heartbeat'); triggerLoveRain(); navigator.vibrate?.([80, 40, 80]); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-soft" aria-label="Send heartbeat"><Heart className="h-5 w-5 fill-[hsl(var(--pink))] text-pink heartbeat-pulse" /></button><input autoFocus value={message} onChange={(event) => { setMessage(event.target.value); onTyping(event.target.value.length > 0); }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Write something sweet…" className="soft-input h-11 min-w-0 flex-1 rounded-full py-2.5 text-sm" /><button onMouseDown={() => setIsRecording(true)} onMouseUp={() => setIsRecording(false)} onTouchStart={() => setIsRecording(true)} onTouchEnd={() => setIsRecording(false)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${isRecording ? 'bg-pink text-white' : 'bg-yellow-soft text-foreground'}`} aria-label="Voice message"><Mic className="h-5 w-5" /></button>{message.trim() && <button onClick={send} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--pink))] text-white" aria-label="Send message"><Send className="h-5 w-5" /></button>}</div>{isRecording && <p className="py-1 text-center text-xs font-semibold text-pink">Hold to record a voice note…</p>}</footer>;
};
export default ChatInput;
