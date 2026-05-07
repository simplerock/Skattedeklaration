'use client';

import { useEffect, useState, useMemo } from 'react';

interface Declaration {
  id: string;
  created_at: string;
  updated_at: string;
  status: string;
  reference_number: string;
  first_name: string;
  last_name: string;
  personal_identity_number: string;
  user_email: string | null;
  user_phone: string | null;
  income_year: number;
  salary: number;
  travel_deduction: number;
  rot_deduction: number;
  rut_deduction: number;
  interest_secured: number;
  interest_unsecured: number;
  rental_net: number;
}

type Filter = 'all' | 'submitted' | 'completed';

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'nyss';
  if (diff < 3600) return `${Math.floor(diff / 60)}m sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h sedan`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d sedan`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function krFmt(n: number) {
  if (!n) return '–';
  return n.toLocaleString('sv-SE') + ' kr';
}

export default function AdminPage() {
  const [rows, setRows] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/declarations')
      .then(r => r.json())
      .then(d => { setRows(d.declarations ?? []); setLoading(false); });
  }, []);

  async function toggleStatus(dec: Declaration, e: React.MouseEvent) {
    e.stopPropagation();
    const next = dec.status === 'completed' ? 'submitted' : 'completed';
    setToggling(dec.id);
    setRows(prev => prev.map(r => r.id === dec.id ? { ...r, status: next } : r));
    await fetch(`/api/admin/declarations/${dec.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setToggling(null);
  }

  async function downloadSru(dec: Declaration, e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(dec.id);
    const res = await fetch(`/api/admin/declarations/${dec.id}/sru`);
    if (!res.ok) { alert('Kunde inte generera SRU.'); setDownloading(null); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${dec.reference_number}.zip`; a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  }

  const counts = useMemo(() => ({
    all: rows.length,
    submitted: rows.filter(r => r.status === 'submitted' || r.status === 'processing').length,
    completed: rows.filter(r => r.status === 'completed').length,
  }), [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === 'submitted') list = list.filter(r => r.status === 'submitted' || r.status === 'processing');
    if (filter === 'completed') list = list.filter(r => r.status === 'completed');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        `${r.first_name} ${r.last_name} ${r.reference_number} ${r.personal_identity_number} ${r.user_email ?? ''}`.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, filter, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827' }}>

      {/* Top bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 56, gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Skattedeklaration</span>
          <span style={{ color: '#d1d5db', fontSize: 18, margin: '0 4px' }}>/</span>
          <span style={{ color: '#6b7280', fontSize: 14 }}>Ärenden</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök..."
              style={{
                padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6,
                fontSize: 13, outline: 'none', width: 200, background: '#f9fafb',
                color: '#111827',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 16, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 }}>
          {([
            { key: 'all',       label: 'Alla' },
            { key: 'submitted', label: 'Inkomna' },
            { key: 'completed', label: 'Klara' },
          ] as { key: Filter; label: string }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: filter === tab.key ? '#111827' : '#6b7280',
                borderBottom: filter === tab.key ? '2px solid #111827' : '2px solid transparent',
                marginBottom: -1, transition: 'color 0.1s',
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: 6, padding: '1px 7px', borderRadius: 20, fontSize: 11,
                background: filter === tab.key ? '#f3f4f6' : 'transparent',
                color: filter === tab.key ? '#374151' : '#9ca3af',
              }}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Laddar ärenden...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Inga ärenden.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['', 'Referens', 'Namn', 'PNR', 'År', 'Avdrag', 'Inkommen', ''].map((h, i) => (
                    <th key={i} style={{
                      padding: '10px 14px', textAlign: i >= 5 ? 'right' : 'left',
                      fontWeight: 500, color: '#9ca3af', fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const isExpanded = expanded === r.id;
                  const isDone = r.status === 'completed';
                  const totalAvdrag = r.travel_deduction + r.rot_deduction + r.rut_deduction + r.interest_secured + r.interest_unsecured + r.rental_net;

                  return (
                    <>
                      <tr
                        key={r.id}
                        onClick={() => setExpanded(isExpanded ? null : r.id)}
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid #f3f4f6',
                          background: isExpanded ? '#fafafa' : '#fff',
                          cursor: 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        {/* Klar toggle */}
                        <td style={{ padding: '12px 14px 12px 16px', width: 32 }}>
                          <button
                            onClick={e => toggleStatus(r, e)}
                            title={isDone ? 'Markera som ej klar' : 'Markera som klar'}
                            style={{
                              width: 20, height: 20, borderRadius: 6,
                              border: isDone ? 'none' : '1.5px solid #d1d5db',
                              background: isDone ? '#16a34a' : '#fff',
                              cursor: toggling === r.id ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s', flexShrink: 0,
                              opacity: toggling === r.id ? 0.5 : 1,
                            }}
                          >
                            {isDone && (
                              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        </td>

                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                          {r.reference_number}
                        </td>

                        <td style={{ padding: '12px 14px', fontWeight: 500, color: isDone ? '#9ca3af' : '#111827', textDecoration: isDone ? 'line-through' : 'none', whiteSpace: 'nowrap' }}>
                          {r.first_name} {r.last_name}
                        </td>

                        <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: 12, color: '#9ca3af' }}>
                          {r.personal_identity_number}
                        </td>

                        <td style={{ padding: '12px 14px', color: '#6b7280' }}>
                          {r.income_year}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 500, color: totalAvdrag > 0 ? '#15803d' : '#9ca3af' }}>
                          {krFmt(totalAvdrag)}
                        </td>

                        <td style={{ padding: '12px 14px', textAlign: 'right', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {timeAgo(r.created_at)}
                        </td>

                        <td style={{ padding: '12px 16px 12px 14px', textAlign: 'right' }}>
                          <button
                            onClick={e => downloadSru(r, e)}
                            disabled={downloading === r.id}
                            style={{
                              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                              border: '1px solid #e5e7eb', background: downloading === r.id ? '#f9fafb' : '#fff',
                              color: downloading === r.id ? '#9ca3af' : '#374151',
                              cursor: downloading === r.id ? 'default' : 'pointer',
                              whiteSpace: 'nowrap', transition: 'all 0.1s',
                            }}
                          >
                            {downloading === r.id ? '...' : '↓ SRU'}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${r.id}-detail`} style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                          <td colSpan={8} style={{ padding: '0 16px 16px 16px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, padding: '14px 0 2px 0', borderTop: '1px solid #f3f4f6' }}>
                              {[
                                { label: 'E-post',           value: r.user_email ?? '–' },
                                { label: 'Telefon',          value: r.user_phone ?? '–' },
                                { label: 'Lön',              value: krFmt(r.salary) },
                                { label: 'Pendling',         value: krFmt(r.travel_deduction) },
                                { label: 'ROT',              value: krFmt(r.rot_deduction) },
                                { label: 'RUT',              value: krFmt(r.rut_deduction) },
                                { label: 'Bolåneränta',      value: krFmt(r.interest_secured) },
                                { label: 'Blancoränta',      value: krFmt(r.interest_unsecured) },
                                { label: 'Uthyrning netto',  value: krFmt(r.rental_net) },
                                { label: 'Totalt avdrag',    value: krFmt(totalAvdrag), highlight: true },
                              ].map(f => (
                                <div key={f.label}>
                                  <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</div>
                                  <div style={{ fontSize: 13, fontWeight: (f as { highlight?: boolean }).highlight ? 600 : 400, color: (f as { highlight?: boolean }).highlight ? '#15803d' : '#374151' }}>{f.value}</div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer count */}
        {!loading && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', textAlign: 'right' }}>
            {filtered.length} {filtered.length === 1 ? 'ärende' : 'ärenden'}
            {search && ` · sök: "${search}"`}
          </div>
        )}
      </div>
    </div>
  );
}
