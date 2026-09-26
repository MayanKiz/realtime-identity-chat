import { useEffect, useState } from 'react';
import PinEntry from '@/components/PinEntry';
import CreateIdentity from '@/components/CreateIdentity';
import AdminDatabase from '@/components/AdminDatabase';
import CampusTradeApp from '@/components/CampusTradeApp';
import { registerServiceWorker } from '@/lib/notifications';
import { User } from '@/lib/supabase';

type ViewMode = 'pin' | 'signup' | 'app' | 'database';

const Index = () => {
  const [view, setView] = useState<ViewMode>('pin');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => { registerServiceWorker(); }, []);
  const lockSession = () => { setCurrentUser(null); setView('pin'); };
  return <main className="app-shell">
    {view === 'pin' && <PinEntry onAccess={(user) => { setCurrentUser(user); setView('app'); }} onAdminAccess={() => setView('database')} onCreateIdentity={() => setView('signup')} />}
    {view === 'signup' && <CreateIdentity onBack={() => setView('pin')} onSuccess={() => setView('pin')} />}
    {view === 'app' && currentUser && <CampusTradeApp currentUser={currentUser} onBack={lockSession} onDeleteAccount={lockSession} />}
    {view === 'database' && <AdminDatabase onBack={() => setView('pin')} />}
  </main>;
};
export default Index;
