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
