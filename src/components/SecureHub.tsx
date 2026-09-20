import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, ChevronRight, Hash, LockKeyhole, LogOut, MessageCircle, Search, Send, ShieldCheck, Trash2, Users, Zap } from 'lucide-react';
import { supabase, User, Message } from '@/lib/supabase';
import { hashPin } from '@/lib/security';

type Rank = 'Leader' | 'Guardian' | 'Member' | 'Newcomer';
type Room = 'community' | 'private';
type ChatMessage = { id: string; author: string; authorId: string; text: string; rank: Rank; time: string; own?: boolean };

interface SecureHubProps { currentUser: User; onBack: () => void; onDeleteAccount: () => void; }
const rankClass: Record<Rank, string> = { Leader: 'rank-leader', Guardian: 'rank-guardian', Member: 'rank-member', Newcomer: 'rank-newcomer' };
const rankOrder: Rank[] = ['Leader', 'Guardian', 'Member', 'Newcomer'];
const getRank = (user?: Partial<User> | null): Rank => user?.rank && rankOrder.includes(user.rank as Rank) ? user.rank as Rank : 'Member';
const formatTime = (value: string) => new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const SecureHub = ({ currentUser, onBack, onDeleteAccount }: SecureHubProps) => {
  const [room, setRoom] = useState<Room>('community');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, community: 0 });
  const [lookupError, setLookupError] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const currentRank = getRank(currentUser);
  const title = room === 'community' ? 'Community room' : target ? `Private channel · ${target.nickname}` : 'Private channel';
  const privateMessages = useMemo(() => messages.filter((message) => message.id.startsWith('private-')), [messages]);

  const mapMessages = async (rows: Message[]) => {
    if (!rows.length) return [] as ChatMessage[];
    const ids = [...new Set(rows.map((row) => row.sender_id).filter(Boolean))] as string[];
    const { data: users } = await supabase.from('users').select('*').in('id', ids);
    const userMap = new Map((users ?? []).map((user) => [user.id, user as User]));
    return rows.map((row) => {
      const sender = row.sender_id ? userMap.get(row.sender_id) : undefined;
      const authorId = row.sender_id ?? 'unknown';
      return { id: `${row.receiver_id ? 'private-' : 'community-'}${row.id}`, author: sender?.nickname ?? `identity-${authorId.slice(0, 5)}`, authorId, text: row.content ?? '', rank: getRank(sender ?? (authorId === currentUser.id ? currentUser : null)), time: formatTime(row.created_at), own: authorId === currentUser.id };
    });
  };

  const loadStats = async () => {
    const [{ count: total }, { count: active }, { data: communityRows }] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_online', true),
      supabase.from('messages').select('sender_id').is('receiver_id', null),
    ]);
    const uniqueCommunity = new Set((communityRows ?? []).map((row) => row.sender_id).filter(Boolean)).size;
    setStats({ total: total ?? 0, active: active ?? 0, community: uniqueCommunity });
  };

  const loadMessages = async () => {
    setLoadingMessages(true);
    let queryBuilder = supabase.from('messages').select('*').order('created_at', { ascending: true }).limit(100);
    if (room === 'community') queryBuilder = queryBuilder.is('receiver_id', null);
    else if (target) queryBuilder = queryBuilder.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${target.id}),and(sender_id.eq.${target.id},receiver_id.eq.${currentUser.id})`);
    else { setLoadingMessages(false); return; }
    const { data } = await queryBuilder;
    if (data) setMessages(await mapMessages(data as Message[]));
    setLoadingMessages(false);
  };

  useEffect(() => {
    let mounted = true;
    void loadStats();
    void supabase.from('users').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', currentUser.id);
    const markOffline = () => { void supabase.from('users').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', currentUser.id); };
    const channel = supabase.channel(`secure-room-${currentUser.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async (payload) => {
      if (!mounted) return;
      const row = (payload.new ?? payload.old) as Message;
      const relevant = row.receiver_id === null || row.sender_id === currentUser.id || row.receiver_id === currentUser.id || row.sender_id === target?.id || row.receiver_id === target?.id;
      if (relevant) { await loadMessages(); void loadStats(); }
    }).subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); markOffline(); };
  }, [currentUser.id, target?.id, room]);

  useEffect(() => { void loadMessages(); }, [room, target?.id]);

  const openPrivate = async () => {
    const pin = query.replace(/\D/g, '').slice(0, 4);
    if (pin.length !== 4) { setLookupError('Enter a 4-digit Chat PIN.'); return; }
    const { data, error } = await supabase.from('users').select('*').eq('connection_pin', await hashPin(pin)).neq('id', currentUser.id).maybeSingle();
    if (error || !data) { setLookupError('No private channel found for that PIN.'); return; }
    setTarget(data as User); setRoom('private'); setQuery(''); setLookupError('');
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || (room === 'private' && !target)) return;
    const { error } = await supabase.from('messages').insert({ sender: 'he', sender_id: currentUser.id, receiver_id: room === 'community' ? null : target?.id, content: text, message_type: 'text' });
    if (!error) setDraft('');
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete this anonymous identity and its messages forever?')) return;
    await supabase.from('messages').delete().or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
    const { error } = await supabase.from('users').delete().eq('id', currentUser.id);
    if (!error) onDeleteAccount();
  };

  const visibleMessages = room === 'community' ? messages.filter((message) => message.id.startsWith('community-')) : privateMessages;
  return <section className="secure-shell">
    <aside className="secure-sidebar"><div className="secure-brand"><span className="secure-brand-mark"><ShieldCheck /></span><span>VEILROOM</span></div><div className="sidebar-status"><span className="status-dot" /> identity online</div><nav className="secure-nav" aria-label="Private navigation"><button className={`nav-item ${room === 'community' ? 'active' : ''}`} onClick={() => setRoom('community')}><Hash /> Community room <span>01</span></button><button className={`nav-item ${room === 'private' ? 'active' : ''}`} onClick={() => target && setRoom('private')} disabled={!target}><MessageCircle /> Private channel <span>{target ? '01' : '—'}</span></button></nav><div className="sidebar-note"><LockKeyhole /><p>No directories.<br />No public profiles.<br />Only intentional access.</p></div><div className="sidebar-bottom"><button className="sidebar-action" onClick={onBack}><LogOut /> Lock session</button><button className="sidebar-action danger" onClick={deleteAccount}><Trash2 /> Delete identity</button></div></aside>
    <main className="secure-main"><header className="secure-topbar"><button className="mobile-back" onClick={onBack} aria-label="Lock session"><ArrowLeft /></button><div><p className="eyebrow">ANONYMOUS NETWORK / 2026</p><h1>Private by design.</h1></div><div className="topbar-privacy"><LockKeyhole /> DATA-ONLY DASHBOARD</div></header>
      <section className="numbers-grid" aria-label="Community statistics"><div className="number-card"><span className="number-label">TOTAL MEMBERS</span><strong>{stats.total.toLocaleString()}</strong><span className="number-caption"><Users /> registered identities</span></div><div className="number-card accent"><span className="number-label">TOTAL ACTIVE MEMBERS</span><strong>{stats.active.toLocaleString()}</strong><span className="number-caption"><Zap /> online right now</span></div><div className="number-card"><span className="number-label">ACTIVE IN COMMUNITY</span><strong>{stats.community.toLocaleString()}</strong><span className="number-caption"><BarChart3 /> posting identities</span></div></section>
      <section className="gateway-card"><div className="gateway-icon"><Search /></div><div className="gateway-copy"><span className="eyebrow">HIDDEN SEARCH GATEWAY</span><h2>Open a private channel</h2><p>Start a private conversation</p></div><div className="gateway-form"><input value={query} onChange={(event) => { setQuery(event.target.value.replace(/\D/g, '').slice(0, 4)); setLookupError(''); }} onKeyDown={(event) => event.key === 'Enter' && void openPrivate()} inputMode="numeric" maxLength={4} placeholder="Chat PIN · · · ·" aria-label="Chat PIN" /><button onClick={() => void openPrivate()} aria-label="Open private channel"><ChevronRight /></button></div>{lookupError && <p className="gateway-error">{lookupError}</p>}</section>
      <section className="room-card"><div className="room-header"><div><div className="room-title"><span className="live-pulse" /><span className="eyebrow">LIVE ROOM</span></div><h2>{title}</h2><p>{room === 'community' ? 'A shared room for registered identities. Nicknames only.' : 'Start a private conversation'}</p></div><div className="room-lock"><LockKeyhole /> {room === 'community' ? 'open to members' : 'Start a private conversation'}</div></div><div className="message-stream">{loadingMessages ? <div className="empty-room"><LockKeyhole /><p>Start a private conversation</p></div> : visibleMessages.length === 0 ? <div className="empty-room"><LockKeyhole /><p>This channel is empty.</p><span>Send the first message when you’re ready.</span></div> : visibleMessages.map((message) => <article className={`message-row ${message.own ? 'own' : ''}`} key={message.id}><div className={`message-avatar ${rankClass[message.rank]}`}>{message.author.slice(0, 1).toUpperCase()}</div><div className="message-body"><div className="message-meta"><strong className={rankClass[message.rank]}>{message.author}</strong><span className="role-badge">{message.rank}</span><time>{message.time}</time></div><p>{message.text}</p></div></article>)}</div><div className="composer"><input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && void send()} placeholder={room === 'community' ? 'Write to the community…' : 'Write privately…'} aria-label="Message" /><button onClick={() => void send()} aria-label="Send message"><Send /></button></div></section>
    </main></section>;
};
export default SecureHub;
