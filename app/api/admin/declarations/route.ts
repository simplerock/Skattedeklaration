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
