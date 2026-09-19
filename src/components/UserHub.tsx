import { useEffect, useState } from 'react';
import { ArrowLeft, Heart, UserRound, Trash2, X, Circle } from 'lucide-react';
import { supabase, User } from '@/lib/supabase';
import { usePanicTap } from '@/hooks/usePanicTap';

interface UserHubProps { currentUser: User; onBack: () => void; onConnect: (targetUser: User) => void; onDeleteAccount: () => void; }

const UserHub = ({ currentUser, onBack, onConnect, onDeleteAccount }: UserHubProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [connectionPin, setConnectionPin] = useState('');
  const [error, setError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  usePanicTap();

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('is_online', { ascending: false }).order('last_seen', { ascending: false });
    if (data) setUsers((data as User[]).filter((user) => user.id !== currentUser.id));
  };

  useEffect(() => {
    void fetchUsers();
    const channel = supabase.channel('users-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => void fetchUsers()).subscribe();
    void supabase.from('users').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', currentUser.id);
    const markOffline = () => { void supabase.from('users').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', currentUser.id); };
    window.addEventListener('beforeunload', markOffline);
    return () => { void supabase.removeChannel(channel); window.removeEventListener('beforeunload', markOffline); markOffline(); };
  }, [currentUser.id]);

  const connect = () => {
    if (!selectedUser || connectionPin.length !== 4) return;
    if (connectionPin === selectedUser.connection_pin) onConnect(selectedUser);
    else { setError(true); window.setTimeout(() => { setConnectionPin(''); setError(false); }, 500); }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Delete your space forever? Your chats will be removed too.')) return;
    setDeleting(true);
    await supabase.from('messages').delete().or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
    const { error: deleteError } = await supabase.from('users').delete().eq('id', currentUser.id);
    setDeleting(false);
    if (deleteError) return;
    onDeleteAccount();
  };

  return (
    <section className="app-shell page-scroll px-4 py-4 sm:px-6">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col">
        <header className="flex items-center justify-between py-3">
          <button onClick={onBack} className="rounded-full p-2 hover:bg-white" aria-label="Log out"><ArrowLeft className="h-5 w-5" /></button>
          <div className="text-center"><p className="text-xs font-semibold uppercase tracking-[.2em] text-pink">your little world</p><h1 className="font-display text-2xl font-semibold">The Hub</h1></div>
          <button onClick={deleteAccount} disabled={deleting} className="Sample Message" aria-label="Delete my space"><Trash2 className="h-5 w-5" /></button>
        </header>

        <div className="cute-card mb-5 flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-soft"><UserRound className="h-6 w-6 text-pink" /></div>
          <div className="min-w-0 flex-1"><p className="truncate font-display text-xl">Hi, {currentUser.nickname}!</p><p className="Sample Message">You are online and ready for a little chat.</p></div>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600"><Circle className="h-2.5 w-2.5 fill-current" /> online</span>
        </div>

        <div className="mb-3 flex items-end justify-between px-1"><div><h2 className="font-display text-xl">People</h2><p className="Sample Message">Tap someone to connect</p></div><Heart className="h-5 w-5 fill-[hsl(var(--pink))] text-pink" /></div>
        <div className="space-y-3 pb-8">
          {users.length === 0 ? <div className="cute-card p-8 text-center"><div className="mb-3 text-4xl">🌷</div><p className="font-semibold">No one else is here yet</p><p className="Sample Message">Invite your favourite person to create a space.</p></div> : users.map((user) => <button key={user.id} onClick={() => { setSelectedUser(user); setConnectionPin(''); }} className="cute-card flex w-full items-center gap-3 p-4 text-left transition-transform hover:-translate-y-0.5 active:scale-[.99]"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint-soft font-display text-xl font-semibold text-foreground">{user.nickname.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{user.nickname}</p><p className="Sample Message">{user.is_online ? 'online now' : 'tap to send a connect request'}</p></div><span className="rounded-full bg-pink-soft px-3 py-1.5 text-xs font-semibold text-pink">Say hi</span></button>)}
        </div>
      </div>

      {selectedUser && <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 p-4 sm:items-center" role="dialog" aria-modal="true" onClick={() => setSelectedUser(null)}>
        <div className="cute-card w-full max-w-sm p-6" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-start justify-between"><div><p className="text-sm font-semibold text-pink">a little hello</p><h2 className="font-display text-2xl">Connect with {selectedUser.nickname}</h2></div><button onClick={() => setSelectedUser(null)} className="rounded-full p-2 hover:bg-pink-soft" aria-label="Close"><X className="h-5 w-5" /></button></div>
          <p className="Sample Message">Enter their 4-digit connect code to open your private chat.</p>
          <input autoFocus className={`soft-input text-center text-2xl tracking-[.5em] ${error ? 'animate-[shake_.3s_ease-in-out] border-red-400' : ''}`} value={connectionPin} onChange={(event) => setConnectionPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="••••" onKeyDown={(event) => { if (event.key === 'Enter') connect(); }} />
          <button onClick={connect} disabled={connectionPin.length !== 4} className="cute-button mt-4 w-full rounded-2xl bg-[hsl(var(--pink))] py-3.5 font-semibold text-white disabled:opacity-40">Open our chat</button>
        </div>
      </div>}
    </section>
  );
};
export default UserHub;
