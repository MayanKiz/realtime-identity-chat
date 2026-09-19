import { ArrowLeft, Circle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/supabase';

interface ChatHeaderProps { currentUser: User; chatPartner: User; otherTyping: boolean; isOtherOnline?: boolean; onBack: () => void; }
const ChatHeader = ({ chatPartner, otherTyping, isOtherOnline, onBack }: ChatHeaderProps) => (
  <header className="flex shrink-0 items-center gap-3 border-b border-border bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur-md safe-bottom-0">
    <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack} aria-label="Back"><ArrowLeft className="h-5 w-5" /></Button>
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-soft font-display text-lg font-semibold text-pink">{chatPartner.nickname.charAt(0).toUpperCase()}</div>
    <div className="min-w-0 flex-1"><h2 className="truncate font-display text-lg font-semibold">{chatPartner.nickname}</h2>{otherTyping ? <p className="text-xs font-semibold text-pink">typing…</p> : <p className="Sample Message"><Circle className={`h-2 w-2 fill-current ${isOtherOnline ? 'text-emerald-500' : 'text-muted-foreground/40'}`} /> {isOtherOnline ? 'online' : 'offline'}</p>}</div>
    <Heart className="h-5 w-5 fill-[hsl(var(--pink))] text-pink" />
  </header>
);
export default ChatHeader;
