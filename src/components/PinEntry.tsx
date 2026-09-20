import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Delete, KeyRound, LockKeyhole, ShieldCheck, Sparkles, UserPlus, X, Users, MessageCircle, Search, Crown } from 'lucide-react';
import { supabase, User } from '@/lib/supabase';
import { hashPin } from '@/lib/security';

interface PinEntryProps { onAccess: (user: User) => void; onAdminAccess: () => void; onCreateIdentity: () => void; }

const PinEntry = ({ onAccess, onAdminAccess, onCreateIdentity }: PinEntryProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const inputRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (pin.length !== 6) return;
    const access = async () => {
      if (pin === '051009') { onAdminAccess(); return; }
      const { data } = await supabase.from('users').select('*').eq('login_pin', await hashPin(pin)).maybeSingle();
      if (data) { onAccess(data as User); return; }
      setError('That Secret PIN was not recognised.');
      window.setTimeout(() => { setPin(''); setError(''); }, 900);
    };
    void access();
  }, [pin, onAccess, onAdminAccess]);

  const press = (key: string | number) => {
    if (key === 'del') setPin((current) => current.slice(0, -1));
    else if (pin.length < 6) setPin((current) => current + key);
  };

  return <section className="akgec-landing page-scroll">
    <div className="akgec-noise" />
    <div className="akgec-orb akgec-orb-one" /><div className="akgec-orb akgec-orb-two" />
    <header className="akgec-header"><div className="akgec-logo"><span className="akgec-logo-mark"><Sparkles /></span><span>AKGEC <b>COMMUNITY</b></span></div><span className="akgec-header-status"><span /> private network</span></header>
    <div className="akgec-layout">
      <div className="akgec-hero"><div className="akgec-kicker"><span className="kicker-line" /> BUILT FOR AKGEC <span className="kicker-line" /></div><h1>Your campus.<br /><em>Your circle.</em><br />Your space.</h1><p className="akgec-copy">A quiet, members-only community for ideas, conversations and connections that stay intentional.</p><div className="akgec-trust-row"><span><ShieldCheck /> nickname-first</span><span><LockKeyhole />Start a private conversation</span></div><button className="akgec-primary" onClick={onCreateIdentity}>Create your account <ArrowRight /></button></div>
      <div className="akgec-access-card"><div className="access-card-top"><div className="access-icon"><KeyRound /></div><div><span className="akgec-label">MEMBER ACCESS</span><h2>Welcome back.</h2></div></div><p className="access-copy">Enter your 6-digit Secret PIN to enter the community.</p><button className="hidden-pin-input" ref={inputRef} onKeyDown={(event) => { if (/^[0-9]$/.test(event.key)) press(event.key); if (event.key === 'Backspace') press('del'); }} aria-label="Secret PIN input" /><div className="access-dots">{[0, 1, 2, 3, 4, 5].map((index) => <span key={index} className={pin.length > index ? 'filled' : ''} />)}</div><div className="access-keypad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, index) => key === null ? <span key={index} /> : <button key={index} onClick={() => press(key)} aria-label={key === 'del' ? 'Delete' : `Number ${key}`}>{key === 'del' ? <Delete /> : key}</button>)}</div>{error && <p className="access-error">{error}</p>}<div className="access-divider"><span /> or <span /></div><button className="access-create" onClick={onCreateIdentity}><UserPlus /> Create a new account</button></div>
    </div>
    <footer className="akgec-footer"><span>AKGEC COMMUNITY / 2026</span><span className="footer-rule" /><button className="akgec-guide-link" onClick={() => setShowGuide(true)}>New here? Learn how it works</button><span className="footer-rule" /><span>private by design</span></footer>
    {showGuide && <div className="akgec-guide-backdrop" role="dialog" aria-modal="true" aria-labelledby="guide-title" onClick={() => setShowGuide(false)}><div className="akgec-guide" onClick={(event) => event.stopPropagation()}><button className="guide-close" onClick={() => setShowGuide(false)} aria-label="Close tutorial"><X /></button><span className="akgec-label">QUICK START GUIDE</span><h2 id="guide-title">Welcome to AKGEC Community.</h2><p className="guide-intro">Start a private conversation</p><div className="guide-steps"><article><span className="guide-number">01</span><div><Users /><h3>Create your identity</h3><p>Start a private conversation</p></div></article><article><span className="guide-number">02</span><div><MessageCircle /><h3>Join the community</h3><p>Enter your Secret PIN to open the dashboard and talk with registered AKGEC members in the community room.</p></div></article><article><span className="guide-number">03</span><div><Search /><h3>Start private chats</h3><p>Use the search gateway with someone’s Chat PIN. There are no contact lists or public directories.</p></div></article></div><div className="guide-features"><span><LockKeyhole />Start a private conversation</span><span><Crown /> visible rank hierarchy</span><span><ShieldCheck /> nickname-first privacy</span></div><button className="akgec-primary guide-cta" onClick={() => { setShowGuide(false); onCreateIdentity(); }}>Create my account <ArrowRight /></button></div></div>}
  </section>;
};
export default PinEntry;
