import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db/supabase';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body;

    const allowed = ['submitted', 'processing', 'completed', 'error'];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: 'Ogiltig status' }, { status: 400 });
    }

    const { error } = await supabase
      .from('declarations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Kunde inte uppdatera status' }, { status: 500 });
    }

    return NextResponse.json({ success: true, status });
  } catch {
    return NextResponse.json({ error: 'Ogiltigt format' }, { status: 400 });
  }
}
