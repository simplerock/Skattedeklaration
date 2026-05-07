'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface Dec {
  id: string;
  created_at: string;
  status: string;
  power_of_attorney_status: string;
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

type Filter = 'all' | 'submitted' | 'processing' | 'completed';

const SC = {
  submitted:  { label: 'Inkommen',  dot: '#f97316', bg: '#fff7ed', text: '#9a3412' },
  processing: { label: 'Behandlas', dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  completed:  { label: 'Klar',      dot: '#22c55e', bg: '#f0fdf4', text: '#15803d' },
  error:      { label: 'Fel',       dot: '#ef4444', bg: '#fef2f2', text: '#dc2626' },
} as const;

const POA_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  klar:          { label: 'Fullmakt klar',    bg: '#f0fdf4', text: '#15803d' },
  fortsatter:    { label: 'Fortsätter ändå',  bg: '#fff7ed', text: '#9a3412' },
  behover_hjalp: { label: 'Behöver hjälp',    bg: '#fef2f2', text: '#dc2626' },
  pending:       { label: 'Ej hanterad',      bg: '#f3f4f6', text: '#6b7280' },
};

const NL: Record<string, string> = {
  submitted:  'Starta behandling',
  processing: 'Markera klar',
  completed:  'Återöppna',
};
const NS: Record<string, string> = {
  submitted:  'processing',
  processing: 'completed',
  completed:  'submitted',
};
const NBtnStyle: Record<string, React.CSSProperties> = {
  submitted:  { background: '#1e40af', color: '#fff', border: 'none' },
  processing: { background: '#15803d', color: '#fff', border: 'none' },
  completed:  { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' },
};

function ago(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'nyss';
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}
function kr(n: number) { return n > 0 ? n.toLocaleString('sv-SE') + ' kr' : '–'; }

export default function AdminPage() {
  const [rows, setRows]       = useState<Dec[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>('all');
  const [search, setSearch]   = useState('');
  const [open, setOpen]       = useState<string | null>(null);
  const [busy, setBusy]       = useState<string | null>(null);
  const [dl, setDl]           = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/declarations')
      .then(r => r.json())
      .then(d => { setRows(d.declarations ?? []); setLoading(false); });
  }, []);

  async function advance(r: Dec, e: React.MouseEvent) {
    e.stopPropagation();
    const next = NS[r.status] ?? 'submitted';
    setBusy(r.id);
    setRows(p => p.map(x => x.id === r.id ? { ...x, status: next } : x));
    await fetch(`/api/admin/declarations/${r.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
  }

  async function updatePoa(r: Dec, value: string) {
    setRows(p => p.map(x => x.id === r.id ? { ...x, power_of_attorney_status: value } : x));
    await fetch(`/api/admin/declarations/${r.id}/fullmakt`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ power_of_attorney_status: value }),
    });
  }

  async function deleteRow(id: string) {
    setRows(p => p.filter(x => x.id !== id));
    setConfirmDelete(null);
    setOpen(null);
    await fetch(`/api/admin/declarations/${id}`, { method: 'DELETE' });
  }

  async function sru(r: Dec, e: React.MouseEvent) {
    e.stopPropagation();
    setDl(r.id);
    const res = await fetch(`/api/admin/declarations/${r.id}/sru`);
    if (!res.ok) { alert('Fel vid SRU-generering'); setDl(null); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${r.reference_number}.zip`; a.click();
    URL.revokeObjectURL(url);
    setDl(null);
  }

  const counts = useMemo(() => ({
    all:        rows.length,
    submitted:  rows.filter(r => r.status === 'submitted').length,
    processing: rows.filter(r => r.status === 'processing').length,
    completed:  rows.filter(r => r.status === 'completed').length,
  }), [rows]);

  const filtered = useMemo(() => {
    let l = rows;
    if (filter !== 'all') l = l.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      l = l.filter(r =>
        `${r.first_name} ${r.last_name} ${r.reference_number} ${r.personal_identity_number} ${r.user_email ?? ''}`
          .toLowerCase().includes(q)
      );
    }
    return l;
  }, [rows, filter, search]);

  const TABS: [Filter, string][] = [
    ['all', 'Alla'], ['submitted', 'Inkomna'], ['processing', 'Behandlas'], ['completed', 'Klara'],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color: '#111827', fontSize: 14 }}>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Radera ärende?</div>
            <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
              Det här går inte att ångra. Ärendet och all data tas bort permanent.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(null)} style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                Avbryt
              </button>
              <button onClick={() => deleteRow(confirmDelete)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#dc2626', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Ja, radera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>Skattedeklaration</span>
          <span style={{ color: '#e5e7eb', margin: '0 2px' }}>/</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Ärenden</span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 20 }}>
            {counts.submitted > 0 && <span style={{ fontSize: 11, color: '#9a3412', background: '#fff7ed', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{counts.submitted} inkomna</span>}
            {counts.processing > 0 && <span style={{ fontSize: 11, color: '#1e40af', background: '#eff6ff', padding: '2px 10px', borderRadius: 20, fontWeight: 600 }}>{counts.processing} behandlas</span>}
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Sök namn, ref, PNR..." style={{ marginLeft: 'auto', padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: 13, outline: 'none', width: 220, background: '#f9fafb' }} />
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px' }}>

        {/* Filter tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
          {TABS.map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)} style={{ padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: filter === k ? '#111827' : '#6b7280', borderBottom: filter === k ? '2px solid #111827' : '2px solid transparent', marginBottom: -1 }}>
              {label}
              <span style={{ marginLeft: 6, padding: '1px 8px', borderRadius: 20, fontSize: 11, background: filter === k ? '#f3f4f6' : 'transparent', color: filter === k ? '#374151' : '#9ca3af' }}>{counts[k]}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>Laddar ärenden...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 500, color: '#374151', marginBottom: 4 }}>Inga ärenden</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Status', 'Referens', 'Namn', 'Fullmakt', 'Avdrag', 'Inkommen', 'Åtgärd', ''].map((h, i) => (
                    <th key={i} style={{ padding: '9px 14px', textAlign: i === 4 ? 'right' : 'left', fontWeight: 600, color: '#6b7280', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const cfg = SC[r.status as keyof typeof SC] ?? SC.submitted;
                  const isOpen = open === r.id;
                  const tot = r.travel_deduction + r.rot_deduction + r.rut_deduction + r.interest_secured + r.interest_unsecured + r.rental_net;
                  const poaStatus = r.power_of_attorney_status || 'pending';
                  const poaCfg = POA_CONFIG[poaStatus] ?? POA_CONFIG.pending;

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        onClick={() => setOpen(isOpen ? null : r.id)}
                        style={{ borderBottom: isOpen ? 'none' : '1px solid #f3f4f6', cursor: 'pointer', background: isOpen ? '#fafafa' : '#fff' }}
                        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        {/* Ärendestatus */}
                        <td style={{ padding: '13px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.text }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Ref */}
                        <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>{r.reference_number}</td>

                        {/* Namn + email */}
                        <td style={{ padding: '13px 14px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {r.first_name} {r.last_name}
                          {r.user_email && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 1 }}>{r.user_email}</div>}
                        </td>

                        {/* Fullmakt dropdown */}
                        <td style={{ padding: '13px 14px' }} onClick={e => e.stopPropagation()}>
                          <select
                            value={poaStatus}
                            onChange={e => updatePoa(r, e.target.value)}
                            style={{
                              padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              border: `1px solid ${poaCfg.bg}`,
                              background: poaCfg.bg, color: poaCfg.text,
                              cursor: 'pointer', outline: 'none',
                            }}
                          >
                            <option value="pending">Ej hanterad</option>
                            <option value="klar">Fullmakt klar</option>
                            <option value="fortsatter">Fortsätter ändå</option>
                            <option value="behover_hjalp">Behöver hjälp</option>
                          </select>
                        </td>

                        {/* Avdrag */}
                        <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 600, color: tot > 0 ? '#15803d' : '#9ca3af' }}>{kr(tot)}</td>

                        {/* Tid */}
                        <td style={{ padding: '13px 14px', color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>{ago(r.created_at)}</td>

                        {/* Åtgärd */}
                        <td style={{ padding: '13px 14px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {(r.status === 'processing' || r.status === 'completed') && (
                              <button onClick={e => sru(r, e)} disabled={dl === r.id} style={{ padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', opacity: dl === r.id ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                                {dl === r.id ? '...' : '↓ SRU'}
                              </button>
                            )}
                            <button onClick={e => { e.stopPropagation(); advance(r, e); }} disabled={busy === r.id} style={{ padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: busy === r.id ? 0.5 : 1, whiteSpace: 'nowrap', ...(NBtnStyle[r.status] ?? NBtnStyle.completed) }}>
                              {busy === r.id ? '...' : NL[r.status] ?? 'Uppdatera'}
                            </button>
                          </div>
                        </td>

                        {/* Radera */}
                        <td style={{ padding: '13px 14px 13px 4px' }} onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDelete(r.id)}
                            title="Radera ärende"
                            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fef2f2'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; (e.currentTarget as HTMLElement).style.borderColor = '#fca5a5'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; (e.currentTarget as HTMLElement).style.color = '#9ca3af'; (e.currentTarget as HTMLElement).style.borderColor = '#e5e7eb'; }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>

                      {/* Detail panel */}
                      {isOpen && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                          <td colSpan={8} style={{ padding: '0 14px 16px' }}>
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0, marginBottom: 14 }}>
                                {([
                                  ['Lön', kr(r.salary)],
                                  ['Pendling', kr(r.travel_deduction)],
                                  ['ROT', kr(r.rot_deduction)],
                                  ['RUT', kr(r.rut_deduction)],
                                  ['Bolåneränta', kr(r.interest_secured)],
                                  ['Blancoränta', kr(r.interest_unsecured)],
                                  ['Uthyrning', kr(r.rental_net)],
                                  ['Inkomstår', String(r.income_year)],
                                  ['Kontakt', r.user_phone ?? r.user_email ?? '–'],
                                  ['Totalt avdrag', kr(tot)],
                                ] as [string, string][]).map(([label, value], i) => (
                                  <div key={label} style={{ padding: '10px 14px', borderRight: (i + 1) % 5 !== 0 ? '1px solid #f3f4f6' : 'none', borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none' }}>
                                    <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                                    <div style={{ fontWeight: i === 9 ? 700 : 500, color: i === 9 ? '#15803d' : '#374151', fontSize: 13 }}>{value}</div>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button onClick={e => advance(r, e)} disabled={busy === r.id} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: busy === r.id ? 0.5 : 1, ...(NBtnStyle[r.status] ?? NBtnStyle.completed) }}>
                                  {NL[r.status] ?? 'Uppdatera'}
                                </button>
                                <button onClick={e => sru(r, e)} disabled={dl === r.id} style={{ padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', cursor: 'pointer', opacity: dl === r.id ? 0.5 : 1 }}>
                                  {dl === r.id ? 'Genererar...' : '↓ Ladda ner SRU-fil'}
                                </button>
                                <button onClick={() => setConfirmDelete(r.id)} style={{ padding: '7px 14px', borderRadius: 7, fontSize: 13, fontWeight: 500, border: '1px solid #fca5a5', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', marginLeft: 'auto' }}>
                                  Radera ärende
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && (
          <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
            <span>{filtered.length} av {rows.length} ärenden</span>
            <span>{counts.completed} klara · {counts.submitted + counts.processing} aktiva</span>
          </div>
        )}
      </div>
    </div>
  );
}
