'use client';

import React, { useEffect, useState, useMemo } from 'react';

interface Declaration {
  id: string;
  created_at: string;
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

type Filter = 'all' | 'submitted' | 'processing' | 'completed';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  submitted:  { label: 'Inkommen',  dot: '#f97316', bg: '#fff7ed', text: '#9a3412' },
  processing: { label: 'Behandlas', dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  completed:  { label: 'Klar',      dot: '#22c55e', bg: '#f0fdf4', text: '#15803d' },
  error:      { label: 'Fel',       dot: '#ef4444', bg: '#fef2f2', text: '#dc2626' },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (d < 60) return 'nyss';
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return new Date(iso).toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
}

function kr(n: number) {
  return n > 0 ? n.toLocaleString('sv-SE') + ' kr' : '–';
}

// ── Next status in workflow ───────────────────────────────────────────────────
const NEXT_STATUS: Record<string, string> = {
  submitted: 'processing',
  processing: 'completed',
  completed: 'submitted',
};

const NEXT_LABEL: Record<string, string> = {
  submitted: 'Starta behandling',
  processing: 'Markera klar',
  completed: 'Återöppna',
};

const NEXT_STYLE: Record<string, React.CSSProperties> = {
  submitted:  { background: '#1e40af', color: '#fff', border: 'none' },
  processing: { background: '#15803d', color: '#fff', border: 'none' },
  completed:  { background: '#fff', color: '#6b7280', border: '1px solid #e5e7eb' },
};

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [rows, setRows] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/declarations')
      .then(r => r.json())
      .then(d => { setRows(d.declarations ?? []); setLoading(false); });
  }, []);

  async function advance(dec: Declaration, e: React.MouseEvent) {
    e.stopPropagation();
    const next = NEXT_STATUS[dec.status] ?? 'submitted';
    setBusy(dec.id);
    setRows(prev => prev.map(r => r.id === dec.id ? { ...r, status: next } : r));
    await fetch(`/api/admin/declarations/${dec.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    setBusy(null);
  }

  async function downloadSru(dec: Declaration, e: React.MouseEvent) {
    e.stopPropagation();
    setDownloading(dec.id);
    const res = await fetch(`/api/admin/declarations/${dec.id}/sru`);
    if (!res.ok) { alert('Kunde inte generera SRU-fil.'); setDownloading(null); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${dec.reference_number}.zip`; a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  }

  // ── Counts per tab ──────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:        rows.length,
    submitted:  rows.filter(r => r.status === 'submitted').length,
    processing: rows.filter(r => r.status === 'processing').length,
    completed:  rows.filter(r => r.status === 'completed').length,
  }), [rows]);

  // ── Filtered rows ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = rows;
    if (filter !== 'all') list = list.filter(r => r.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        `${r.first_name} ${r.last_name} ${r.reference_number} ${r.personal_identity_number} ${r.user_email ?? ''}`
          .toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, filter, search]);

  const TABS: { key: Filter; label: string }[] = [
    { key: 'all',        label: 'Alla' },
    { key: 'submitted',  label: 'Inkomna' },
    { key: 'processing', label: 'Behandlas' },
    { key: 'completed',  label: 'Klara' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827', fontSize: 14 }}>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1140, margin: '0 auto', display: 'flex', alignItems: 'center', height: 52, gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em', color: '#111827' }}>Skattedeklaration</span>
          <span style={{ color: '#e5e7eb' }}>/</span>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Ärenden</span>

          {/* Quick stats */}
          <div style={{ display: 'flex', gap: 16, marginLeft: 24 }}>
            {counts.submitted > 0 && (
              <span style={{ fontSize: 12, color: '#9a3412', background: '#fff7ed', padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>
                {counts.submitted} inkomna
              </span>
            )}
            {counts.processing > 0 && (
              <span style={{ fontSize: 12, color: '#1e40af', background: '#eff6ff', padding: '2px 10px', borderRadius: 20, fontWeight: 500 }}>
                {counts.processing} under behandling
              </span>
            )}
          </div>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Sök namn, ref, PNR..."
            style={{
              marginLeft: 'auto', padding: '6px 12px',
              border: '1px solid #e5e7eb', borderRadius: 6,
              fontSize: 13, outline: 'none', width: 220,
              background: '#f9fafb', color: '#111827',
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '20px 24px' }}>

        {/* ── Workflow guide ───────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
          {['Inkommen', 'Behandlas', 'Klar'].map((step, i) => (
            <React.Fragment key={step}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? '#fff7ed' : i === 1 ? '#eff6ff' : '#f0fdf4',
                  color: i === 0 ? '#9a3412' : i === 1 ? '#1e40af' : '#15803d',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>{step}</span>
              </div>
              {i < 2 && <span style={{ color: '#d1d5db', fontSize: 16 }}>→</span>}
            </React.Fragment>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
            Klicka på en rad för detaljer · Använd knappen för att flytta ärendet vidare
          </span>
        </div>

        {/* ── Filter tabs ──────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: 16 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500,
                color: filter === tab.key ? '#111827' : '#6b7280',
                borderBottom: filter === tab.key ? '2px solid #111827' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {tab.label}
              <span style={{
                marginLeft: 6, padding: '1px 8px', borderRadius: 20, fontSize: 11,
                background: filter === tab.key ? '#f3f4f6' : 'transparent',
                color: filter === tab.key ? '#374151' : '#9ca3af',
              }}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* ── Table ────────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>Laddar ärenden...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 64, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✓</div>
              <div style={{ fontWeight: 500, color: '#374151', marginBottom: 4 }}>Inga ärenden här</div>
              <div style={{ fontSize: 12 }}>{filter === 'completed' ? 'Inga avslutade ärenden ännu.' : 'Allt är hanterat.'}</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Status', 'Referens', 'Namn', 'PNR', 'Lön', 'Avdrag', 'Inkommen', 'Åtgärd'].map((h, i) => (
                    <th key={h} style={{
                      padding: '9px 14px',
                      textAlign: (i === 4 || i === 5) ? 'right' : 'left',
                      fontWeight: 600, color: '#6b7280', fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const cfg = STATUS_CONFIG[r.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.submitted;
                  const isOpen = expanded === r.id;
                  const totalAvdrag = r.travel_deduction + r.rot_deduction + r.rut_deduction + r.interest_secured + r.interest_unsecured + r.rental_net;

                  return (
                    <React.Fragment key={r.id}>
                      {/* ── Main row ─────────────────────────────────────── */}
                      <tr
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                        style={{
                          borderBottom: isOpen ? 'none' : '1px solid #f3f4f6',
                          cursor: 'pointer',
                          background: isOpen ? '#fafafa' : '#fff',
                        }}
                        onMouseEnter={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                      >
                        {/* Status badge */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                            background: cfg.bg, color: cfg.text,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Ref */}
                        <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: 11, color: '#2563eb', fontWeight: 600 }}>
                          {r.reference_number}
                        </td>

                        {/* Namn */}
                        <td style={{ padding: '13px 14px', fontWeight: 500, color: '#111827', whiteSpace: 'nowrap' }}>
                          {r.first_name} {r.last_name}
                          {r.user_email && <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400, marginTop: 1 }}>{r.user_email}</div>}
                        </td>

                        {/* PNR */}
                        <td style={{ padding: '13px 14px', fontFamily: 'monospace', fontSize: 11, color: '#9ca3af' }}>
                          {r.personal_identity_number}
                        </td>

                        {/* Lön */}
                        <td style={{ padding: '13px 14px', textAlign: 'right', color: '#374151', fontWeight: 500 }}>
                          {kr(r.salary)}
                        </td>

                        {/* Avdrag */}
                        <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 600, color: totalAvdrag > 0 ? '#15803d' : '#9ca3af' }}>
                          {kr(totalAvdrag)}
                        </td>

                        {/* Tid */}
                        <td style={{ padding: '13px 14px', color: '#9ca3af', whiteSpace: 'nowrap', fontSize: 12 }}>
                          {timeAgo(r.created_at)}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '13px 14px', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            {/* SRU - only show when processing or completed */}
                            {(r.status === 'processing' || r.status === 'completed') && (
                              <button
                                onClick={e => downloadSru(r, e)}
                                disabled={downloading === r.id}
                                style={{
                                  padding: '5px 11px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                                  border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
                                  cursor: 'pointer', opacity: downloading === r.id ? 0.5 : 1,
                                }}
                              >
                                {downloading === r.id ? '...' : '↓ SRU'}
                              </button>
                            )}

                            {/* Advance status */}
                            <button
                              onClick={e => advance(r, e)}
                              disabled={busy === r.id}
                              style={{
                                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                                cursor: busy === r.id ? 'default' : 'pointer',
                                opacity: busy === r.id ? 0.5 : 1,
                                ...NEXT_STYLE[r.status],
                              }}
                            >
                              {busy === r.id ? '...' : NEXT_LABEL[r.status] ?? 'Uppdatera'}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Detail panel ─────────────────────────────────── */}
                      {isOpen && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fafafa' }}>
                          <td colSpan={8} style={{ padding: '0 14px 16px 14px' }}>
                            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>

                              {/* Deduction breakdown */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, marginBottom: 14 }}>
                                {[
                                  { label: 'Lön (inkomst)',      value: kr(r.salary),                highlight: false },
                                  { label: 'Pendlingsavdrag',    value: kr(r.travel_deduction),      highlight: false },
                                  { label: 'ROT-avdrag',         value: kr(r.rot_deduction),         highlight: false },
                                  { label: 'RUT-avdrag',         value: kr(r.rut_deduction),         highlight: false },
                                  { label: 'Ränteavdrag (bolån)',value: kr(r.interest_secured),      highlight: false },
                                  { label: 'Ränteavdrag (blanco)',value: kr(r.interest_unsecured),   highlight: false },
                                  { label: 'Uthyrning netto',    value: kr(r.rental_net),            highlight: false },
                                  { label: 'Inkomstår',          value: String(r.income_year),       highlight: false },
                                  { label: 'Kontakt',            value: r.user_phone ?? r.user_email ?? '–', highlight: false },
                                  { label: 'Totalt avdrag',      value: kr(totalAvdrag),             highlight: true },
                                ].map((f, i) => (
                                  <div
                                    key={f.label}
                                    style={{
                                      padding: '10px 14px',
                                      borderRight: (i + 1) % 6 !== 0 ? '1px solid #f3f4f6' : 'none',
                                      borderBottom: i < 6 ? '1px solid #f3f4f6' : 'none',
                                    }}
                                  >
                                    <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{f.label}</div>
                                    <div style={{ fontWeight: f.highlight ? 700 : 500, color: f.highlight ? '#15803d' : '#374151', fontSize: 13 }}>{f.value}</div>
                                  </div>
                                ))}
                              </div>

                              {/* Action bar inside detail */}
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                  onClick={e => advance(r, e)}
                                  disabled={busy === r.id}
                                  style={{
                                    padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                    cursor: 'pointer', opacity: busy === r.id ? 0.5 : 1,
                                    ...NEXT_STYLE[r.status],
                                  }}
                                >
                                  {NEXT_LABEL[r.status] ?? 'Uppdatera'}
                                </button>

                                <button
                                  onClick={e => downloadSru(r, e)}
                                  disabled={downloading === r.id}
                                  style={{
                                    padding: '7px 16px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                                    border: '1px solid #e5e7eb', background: '#fff', color: '#374151',
                                    cursor: 'pointer', opacity: downloading === r.id ? 0.5 : 1,
                                  }}
                                >
                                  {downloading === r.id ? 'Genererar...' : '↓ Ladda ner SRU-fil'}
                                </button>

                                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                                  Ref: {r.reference_number} · PNR: {r.personal_identity_number} · {r.income_year}
                                </span>
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

        {/* Footer */}
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
