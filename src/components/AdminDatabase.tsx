import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Database, Eye, EyeOff, RefreshCw, Search, ShieldCheck, Table2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TableName = 'users' | 'messages' | 'typing_status' | 'chat_settings';
type Row = Record<string, unknown>;

const tableNames: TableName[] = ['users', 'messages', 'typing_status', 'chat_settings'];
const tableLabels: Record<TableName, string> = {
  users: 'Users',
  messages: 'Messages',
  typing_status: 'Typing status',
  chat_settings: 'Chat settings',
};

const formatValue = (value: unknown, key: string, revealPins: boolean) => {
  if (value === null || value === undefined) return '—';
  if ((key === 'login_pin' || key === 'connection_pin') && !revealPins) return '••••••';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const AdminDatabase = ({ onBack }: { onBack: () => void }) => {
  const [activeTable, setActiveTable] = useState<TableName>('users');
  const [rows, setRows] = useState<Record<TableName, Row[]>>({ users: [], messages: [], typing_status: [], chat_settings: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [revealPins, setRevealPins] = useState(false);

  const loadTables = useCallback(async (isRefresh = false) => {
    setError('');
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const results = await Promise.all(tableNames.map(async (table) => {
      const { data, error: queryError } = await supabase.from(table).select('*');
      return { table, data: (data ?? []) as unknown as Row[], error: queryError };
    }));
    const failed = results.find((result) => result.error);
    if (failed?.error) setError(`Could not read ${tableLabels[failed.table].toLowerCase()}.`);
    else {
      setRows(results.reduce((next, result) => ({ ...next, [result.table]: result.data }), { users: [], messages: [], typing_status: [], chat_settings: [] } as Record<TableName, Row[]>));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadTables();
    const channel = supabase
      .channel('admin-database-live')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => void loadTables(true))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadTables]);

  const columns = useMemo(() => {
    const keys = new Set<string>();
    rows[activeTable].forEach((row) => Object.keys(row).forEach((key) => keys.add(key)));
    return Array.from(keys);
  }, [activeTable, rows]);

  const filteredRows = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return rows[activeTable];
    return rows[activeTable].filter((row) => Object.entries(row).some(([key, value]) => `${key} ${formatValue(value, key, revealPins)}`.toLowerCase().includes(normalized)));
  }, [activeTable, revealPins, rows, search]);

  return (
    <section className="database-shell">
      <header className="database-topbar">
        <button className="database-back" onClick={onBack} aria-label="Back to access screen"><ArrowLeft /></button>
        <div className="database-title"><span className="database-mark"><Database /></span><div><p className="database-eyebrow">PRIVATE NETWORK / READ ONLY</p><h1>Database access</h1></div></div>
        <div className="database-actions">
          <button className="database-icon-button" onClick={() => setRevealPins((value) => !value)} aria-label={revealPins ? 'Hide PINs' : 'Reveal PINs'} title={revealPins ? 'Hide PINs' : 'Reveal PINs'}>{revealPins ? <EyeOff /> : <Eye />}</button>
          <button className="database-refresh" onClick={() => void loadTables(true)} disabled={refreshing}><RefreshCw className={refreshing ? 'is-spinning' : ''} /> Refresh</button>
        </div>
      </header>

      <main className="database-content">
        <div className="database-intro"><div><p className="database-eyebrow">LIVE DATA VIEWER</p><h2>Everything in one quiet place.</h2><p>Browse the four app tables without leaving the site. Changes appear automatically.</p></div><div className="database-safe"><ShieldCheck /><span>PIN fields are hidden by default</span></div></div>

        <nav className="database-tabs" aria-label="Database tables">
          {tableNames.map((table) => <button key={table} className={activeTable === table ? 'active' : ''} onClick={() => { setActiveTable(table); setSearch(''); }}><Table2 /><span>{tableLabels[table]}</span><b>{rows[table].length}</b></button>)}
        </nav>

        <section className="database-table-card" aria-live="polite">
          <div className="database-table-header"><div><p className="database-eyebrow">TABLE / {activeTable.toUpperCase()}</p><h3>{tableLabels[activeTable]}</h3><span>{filteredRows.length} of {rows[activeTable].length} rows</span></div><label className="database-search"><Search /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this table" aria-label="Search this table" /></label></div>
          {loading ? <div className="database-empty"><RefreshCw className="is-spinning" /><p>Reading your tables…</p></div> : error ? <div className="database-empty"><Database /><p>{error}</p><button onClick={() => void loadTables(true)}>Try again</button></div> : filteredRows.length === 0 ? <div className="database-empty"><Database /><p>No rows match this search.</p></div> : <div className="database-table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{column.replace(/_/g, ' ')}</th>)}</tr></thead><tbody>{filteredRows.map((row, index) => <tr key={String(row.id ?? `${activeTable}-${index}`)}>{columns.map((column) => <td key={column} title={formatValue(row[column], column, revealPins)}>{formatValue(row[column], column, revealPins)}</td>)}</tr>)}</tbody></table></div>}
        </section>
      </main>
    </section>
  );
};

export default AdminDatabase;