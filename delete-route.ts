import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await supabase
    .from('declarations')
    .delete()
    .eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Kunde inte radera' }, { status: 500 });
  return NextResponse.json({ success: true });
}
