#!/bin/bash
TARGET=~/Desktop/skattedeklaration

cat > $TARGET/app/admin/page.tsx << 'EOF'
'use client';

import { useEffect, useState } from 'react';

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

const STATUS: Record<string, { label: string; bg: string; color: string }> = {
  submitted:  { label: 'Inkommen',    bg: '#fff7ed', color: '#c2410c' },
  processing: { label: 'Behandlas',   bg: '#eff6ff', color: '#1d4ed8' },
  completed:  { label: 'Klar',        bg: '#f0fdf4', color: '#15803d' },
  error:      { label: 'Fel',         bg: '#fef2f2', color: '#dc2626' },
};

function fmt(n: number) {
  return n > 0 ? n.toLocaleString('sv-SE') + ' kr' : '–';
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return 'Just nu';
  if (diff < 3600) return `${Math.floor(diff/60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff/3600)} tim sedan`;
  return new Date(iso).toLocaleDateString('sv-SE');
}

export default function AdminPage() {
  const [rows, setRows]         = useState<Declaration[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Declaration | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    fetch('/api/admin/declarations')
      .then(r => r.json())
      .then(d => { setRows(d.declarations ?? []); setLoading(false); });
  }, []);

  async function downloadSru(dec: Declaration) {
    setDownloading(dec.id);
    const res = await fetch(`/api/admin/declarations/${dec.id}/sru`);
    if (!res.ok) { alert('Kunde inte generera SRU.'); setDownloading(null); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${dec.reference_number}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return !q || `${r.first_name} ${r.last_name} ${r.reference_number} ${r.personal_identity_number} ${r.user_email}`.toLowerCase().includes(q);
  });

  const stats = {
    total:      rows.length,
    submitted:  rows.filter(r => r.status === 'submitted').length,
    completed:  rows.filter(r => r.status === 'completed').length,
    totalSalary: rows.reduce((s, r) => s + r.salary, 0),
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', height: 60, gap: 12 }}>
          <div style={{ width: 28, height: 28, background: '#1e40af', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 14 }}>⚡</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Skattedeklaration</span>
          <span style={{ color: '#cbd5e1', margin: '0 4px' }}>·</span>
          <span style={{ color: '#64748b', fontSize: 14 }}>Admin</span>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Totalt',       value: stats.total,      sub: 'ärenden',      color: '#1e40af' },
            { label: 'Inkomna',      value: stats.submitted,  sub: 'väntar',       color: '#c2410c' },
            { label: 'Klara',        value: stats.completed,  sub: 'behandlade',   color: '#15803d' },
            { label: 'Total lön',    value: fmt(stats.totalSalary), sub: 'rapporterad', color: '#7c3aed', isText: true },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontSize: s.isText ? 20 : 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Sök namn, ref, PNR, e-post..."
              style={{ width: '100%', padding: '9px 12px 9px 36px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginLeft: 'auto', color: '#64748b', fontSize: 13 }}>
            {loading ? 'Laddar...' : `${filtered.length} av ${rows.length}`}
          </div>
        </div>

        {/* Tabell */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Hämtar ärenden...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>Inga ärenden hittades.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Referens', 'Namn', 'Personnummer', 'Kontakt', 'År', 'Lön', 'Avdrag', 'Status', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 600, color: '#374151', textAlign: h === 'Lön' || h === 'Avdrag' ? 'right' : 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const st = STATUS[r.status] ?? STATUS.submitted;
                  const totalAvdrag = r.travel_deduction + r.rot_deduction + r.rut_deduction + r.interest_secured + r.interest_unsecured + r.rental_net;
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelected(selected?.id === r.id ? null : r)}
                      style={{ cursor: 'pointer', borderBottom: '1px solid #f1f5f9', background: selected?.id === r.id ? '#f0f7ff' : '#fff', transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (selected?.id !== r.id) (e.currentTarget as HTMLElement).style.background = '#f8fafc'; }}
                      onMouseLeave={e => { if (selected?.id !== r.id) (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                    >
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#1e40af', fontWeight: 600 }}>{r.reference_number}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>{r.first_name} {r.last_name}</td>
                      <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: 12, color: '#64748b' }}>{r.personal_identity_number}</td>
                      <td style={{ padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                        <div>{r.user_email ?? '–'}</div>
                        {r.user_phone && <div style={{ marginTop: 2 }}>{r.user_phone}</div>}
                      </td>
                      <td style={{ padding: '14px 16px', color: '#374151' }}>{r.income_year}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 500, color: '#0f172a' }}>{fmt(r.salary)}</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', color: '#15803d', fontWeight: 500 }}>{fmt(totalAvdrag)}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={e => { e.stopPropagation(); downloadSru(r); }}
                          disabled={downloading === r.id}
                          style={{ background: downloading === r.id ? '#e2e8f0' : '#1e40af', color: downloading === r.id ? '#94a3b8' : '#fff', border: 'none', padding: '7px 14px', borderRadius: 7, cursor: downloading === r.id ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                        >
                          {downloading === r.id ? '⏳ Genererar...' : '⬇ SRU'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Detaljvy */}
        {selected && (
          <div style={{ marginTop: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{selected.first_name} {selected.last_name}</span>
                <span style={{ marginLeft: 12, fontFamily: 'monospace', fontSize: 13, color: '#1e40af' }}>{selected.reference_number}</span>
                <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 13 }}>{timeAgo(selected.created_at)}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18, padding: '0 4px' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { label: 'Lön',              value: fmt(selected.salary) },
                { label: 'Pendlingsavdrag',  value: fmt(selected.travel_deduction) },
                { label: 'ROT',              value: fmt(selected.rot_deduction) },
                { label: 'RUT',              value: fmt(selected.rut_deduction) },
                { label: 'Bolåneränta',      value: fmt(selected.interest_secured) },
                { label: 'Blancolåneränta',  value: fmt(selected.interest_unsecured) },
                { label: 'Uthyrning netto',  value: fmt(selected.rental_net) },
                { label: 'Inkomstår',        value: String(selected.income_year) },
              ].map((item, i) => (
                <div key={item.label} style={{ padding: '16px 24px', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none', borderRight: (i+1) % 4 !== 0 ? '1px solid #f1f5f9' : 'none' }}>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
              <button
                onClick={() => downloadSru(selected)}
                disabled={downloading === selected.id}
                style={{ background: '#1e40af', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                {downloading === selected.id ? '⏳ Genererar SRU...' : '⬇ Ladda ner SRU-fil'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
EOF

echo "✅ Admin UI uppdaterat"
