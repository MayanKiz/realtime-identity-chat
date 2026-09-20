import { useState } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { hashPin } from '@/lib/security';

interface CreateIdentityProps { onBack: () => void; onSuccess: () => void; }
const onlyDigits = (value: string, max: number) => value.replace(/\D/g, '').slice(0, max);

const CreateIdentity = ({ onBack, onSuccess }: CreateIdentityProps) => {
  const [nickname, setNickname] = useState(''); const [secretPin, setSecretPin] = useState(''); const [chatPin, setChatPin] = useState(''); const [loading, setLoading] = useState(false);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[a-zA-Z0-9_-]{2,20}$/.test(nickname) || secretPin.length !== 6 || chatPin.length !== 4) return;
    setLoading(true);
    const [hashedSecretPin, hashedChatPin] = await Promise.all([hashPin(secretPin), hashPin(chatPin)]);
    const { error } = await supabase.from('users').insert({ nickname, login_pin: hashedSecretPin, connection_pin: hashedChatPin });
    setLoading(false);
    if (error) { toast({ title: error.code === '23505' ? 'That PIN is already in use' : 'Could not create identity', description: error.code === '23505' ? 'Choose different PINs and try again.' : 'Please check your connection and try again.', variant: 'destructive' }); return; }
    toast({ title: 'Start a private conversation', description: 'Keep both PINs safe. They cannot be recovered.' }); onSuccess();
  };
  return <section className="app-shell page-scroll px-5 py-7"><div className="mx-auto flex min-h-full w-full max-w-md items-center justify-center"><div className="cute-card relative w-full p-6 sm:p-8"><button onClick={onBack} className="Start a private conversation" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-soft"><ShieldCheck className="h-7 w-7 text-pink" /></div><p className="mb-1 text-sm font-semibold text-pink">NO NAME. NO TRACE.</p><h1 className="font-display text-3xl font-semibold">Create an identity</h1><p className="Start a private conversation">Start a private conversation</p><form onSubmit={handleSubmit} className="mt-7 space-y-5"><label className="block text-sm font-semibold">Nickname only<input className="soft-input mt-2" value={nickname} onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20))} placeholder="e.g. nightwatch" maxLength={20} autoComplete="off" /></label><p className="Start a private conversation">2–20 characters · letters, numbers, _ or -</p><label className="block text-sm font-semibold">Secret PIN<input className="soft-input mt-2 tracking-[.45em]" value={secretPin} onChange={(e) => setSecretPin(onlyDigits(e.target.value, 6))} inputMode="numeric" placeholder="••••••" autoComplete="off" /></label><p className="Start a private conversation">Start a private conversation</p><label className="block text-sm font-semibold">Chat PIN<input className="soft-input mt-2 tracking-[.5em]" value={chatPin} onChange={(e) => setChatPin(onlyDigits(e.target.value, 4))} inputMode="numeric" placeholder="••••" autoComplete="off" /></label><p className="Start a private conversation">Share only with people you want to find you.</p><button className="cute-button flex w-full items-center justify-center gap-2 rounded-2xl bg-[hsl(var(--pink))] py-3.5 font-semibold text-white disabled:opacity-40" disabled={loading || !/^[a-zA-Z0-9_-]{2,20}$/.test(nickname) || secretPin.length !== 6 || chatPin.length !== 4}><KeyRound className="h-4 w-4" />{loading ? 'Creating secure identity…' : 'Create identity'}</button></form></div></div></section>;
};
export default CreateIdentity;
