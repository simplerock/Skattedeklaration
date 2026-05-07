#!/bin/bash
# Admin UI + SRU-generator setup
TARGET=~/Desktop/skattedeklaration

echo "Skapar mappar..."
mkdir -p $TARGET/lib/sru
mkdir -p $TARGET/app/admin
mkdir -p $TARGET/app/api/admin/declarations
mkdir -p "$TARGET/app/api/admin/declarations/[id]/sru"

# ── lib/sru/generator.ts ──────────────────────────────────────────────
cat > $TARGET/lib/sru/generator.ts << 'EOF'
import type { DeclarationRecord } from '../types/declaration';

const LF = '\n';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function sruDate(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`;
}

function sruTime(): string {
  const d = new Date();
  return `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// Returnerar { infoSru, blankettSru } som strängar (LF, ISO 8859-1-kompatibel)
export function generateSruFiles(rec: DeclarationRecord): { infoSru: string; blankettSru: string } {
  const pnr   = rec.personal_identity_number.replace(/\D/g, '');
  const namn  = `${rec.last_name}, ${rec.first_name}`;
  const date  = sruDate();
  const time  = sruTime();
  const year  = rec.income_year;

  // ---- INFO.SRU ----
  const infoLines = [
    '#DATABESKRIVNING_START',
    '#PRODUKT SRU',
    `#SKAPAD ${date}`,
    '#PROGRAM Skattedeklaration 1.0',
    '#FILNAMN BLANKETTER.SRU',
    '#DATABESKRIVNING_SLUT',
    '#MEDIELEV_START',
    `#ORGNR ${pnr}`,
    `#NAMN ${namn}`,
    `#POSTNR 00000`,   // ersätt med riktigt postnr om det lagras
    `#POSTORT Okand`,
    `#KONTAKT ${rec.first_name} ${rec.last_name}`,
    '#MEDIELEV_SLUT',
  ];
  const infoSru = infoLines.join(LF) + LF;

  // ---- BLANKETTER.SRU ----
  const token = `INK1-${year}P4`;
  const lines: string[] = [
    `#BLANKETT ${token}`,
    `#IDENTITET ${pnr} ${date} ${time}`,
    `#NAMN ${namn}`,
  ];

  const add = (kod: number, val: number) => {
    if (val > 0) lines.push(`#UPPGIFT ${kod} ${val}`);
  };

  add(1000, rec.salary);
  add(1070, rec.travel_deduction);
  add(1073, rec.other_work_expenses);
  add(1583, rec.rot_deduction);
  add(1584, rec.rut_deduction);
  add(1101, rec.rental_net);
  add(1102, rec.capital_gain_funds);
  add(1170, rec.interest_secured);
  add(1177, rec.interest_unsecured);
  add(1172, rec.capital_loss_funds);

  // K5 — bostadsförsäljning
  if (rec.housing_sale_price && rec.housing_buy_price) {
    const sp  = rec.housing_sale_price;
    const bp  = rec.housing_buy_price;
    const imp = rec.housing_improvements ?? 0;
    const sc  = rec.housing_sale_costs   ?? 0;
    const res = sp - bp - imp - sc;

    lines.push('#BLANKETTSLUT');
    lines.push(`#BLANKETT K5-${year}P4`);
    lines.push(`#IDENTITET ${pnr} ${date} ${time}`);
    lines.push(`#NAMN ${namn}`);
    lines.push(`#UPPGIFT 3620 ${sp}`);
    lines.push(`#UPPGIFT 3621 ${sc}`);
    lines.push(`#UPPGIFT 3622 ${bp}`);
    if (imp > 0) lines.push(`#UPPGIFT 3623 ${imp}`);
    lines.push(`#UPPGIFT 3625 ${res}`);
    if (res > 0) lines.push(`#UPPGIFT 3629 ${res}`);
    else         lines.push(`#UPPGIFT 3630 ${Math.abs(res)}`);
  }

  lines.push('#BLANKETTSLUT');
  lines.push('#FIL_SLUT');

  const blankettSru = lines.join(LF) + LF;
  return { infoSru, blankettSru };
}
EOF

# ── app/api/admin/declarations/route.ts ──────────────────────────────
cat > $TARGET/app/api/admin/declarations/route.ts << 'EOF'
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

// GET /api/admin/declarations
// Returnerar alla ärenden, nyast först
export async function GET() {
  const { data, error } = await supabase
    .from('declarations')
    .select(`
      id, created_at, status, reference_number,
      first_name, last_name, personal_identity_number,
      user_email, user_phone, income_year,
      salary, travel_deduction, rot_deduction, rut_deduction,
      interest_secured, interest_unsecured, rental_net
    `)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ declarations: data });
}
EOF

# ── app/api/admin/declarations/[id]/sru/route.ts ─────────────────────
mkdir -p "$TARGET/app/api/admin/declarations/[id]/sru"
cat > "$TARGET/app/api/admin/declarations/[id]/sru/route.ts" << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { getDeclarationById } from '@/lib/db/declarations';
import { generateSruFiles } from '@/lib/sru/generator';
import JSZip from 'jszip';

// GET /api/admin/declarations/[id]/sru
// Genererar och returnerar en zip med INFO.SRU + BLANKETTER.SRU
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getDeclarationById(id);

  if (!record) {
    return NextResponse.json({ error: 'Ärendet hittades inte.' }, { status: 404 });
  }

  const { infoSru, blankettSru } = generateSruFiles(record);

  const zip = new JSZip();
  zip.file('INFO.SRU',      infoSru,      { binary: false });
  zip.file('BLANKETTER.SRU', blankettSru, { binary: false });

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      'Content-Type':        'application/zip',
      'Content-Disposition': `attachment; filename="${record.reference_number}.zip"`,
    },
  });
}
EOF

# ── app/admin/page.tsx ────────────────────────────────────────────────
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
  income_year: number;
  salary: number;
  travel_deduction: number;
  rot_deduction: number;
  rut_deduction: number;
  interest_secured: number;
}

const STATUS_COLOR: Record<string, string> = {
  submitted:  '#f59e0b',
  processing: '#3b82f6',
  completed:  '#10b981',
  error:      '#ef4444',
};

function fmt(n: number) {
  return n > 0 ? n.toLocaleString('sv-SE') + ' kr' : '–';
}

export default function AdminPage() {
  const [rows, setRows]       = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/declarations')
      .then(r => r.json())
      .then(d => { setRows(d.declarations ?? []); setLoading(false); });
  }, []);

  async function downloadSru(id: string, ref: string) {
    setDownloading(id);
    const res = await fetch(`/api/admin/declarations/${id}/sru`);
    if (!res.ok) { alert('Kunde inte generera SRU.'); setDownloading(null); return; }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${ref}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(null);
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Deklarationsärenden</h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: 14 }}>
            {loading ? 'Laddar...' : `${rows.length} ärenden`}
          </p>
        </div>
      </div>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Hämtar ärenden...</p>
      ) : rows.length === 0 ? (
        <p style={{ color: '#6b7280' }}>Inga ärenden ännu.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                {['Referens','Namn','PNR','E-post','År','Lön','Pendling','ROT','RUT','Bolån','Status','SRU'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: 12, whiteSpace: 'nowrap' }}>{r.reference_number}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', whiteSpace: 'nowrap' }}>{r.first_name} {r.last_name}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', fontFamily: 'monospace', fontSize: 12 }}>{r.personal_identity_number}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: 12 }}>{r.user_email ?? '–'}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>{r.income_year}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmt(r.salary)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmt(r.travel_deduction)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmt(r.rot_deduction)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmt(r.rut_deduction)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6', textAlign: 'right' }}>{fmt(r.interest_secured)}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{
                      background: STATUS_COLOR[r.status] + '22',
                      color: STATUS_COLOR[r.status],
                      padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600
                    }}>{r.status}</span>
                  </td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <button
                      onClick={() => downloadSru(r.id, r.reference_number)}
                      disabled={downloading === r.id}
                      style={{
                        background: '#1d4ed8', color: '#fff', border: 'none',
                        padding: '5px 12px', borderRadius: 5, cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                        opacity: downloading === r.id ? 0.6 : 1,
                      }}
                    >
                      {downloading === r.id ? 'Genererar...' : '⬇ SRU'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
EOF

echo ""
echo "✅ Admin-UI klart!"
echo ""
echo "Nästa steg:"
echo "  1. npm install jszip"
echo "  2. npm run dev"
echo "  3. Öppna http://localhost:3000/admin"
