import { supabase } from './supabase';
import type { SubmissionPayload, DeclarationRecord } from '../types/declaration';

const n = (v: number | undefined): number => Math.round(v ?? 0);

export async function createDeclaration(payload: SubmissionPayload): Promise<DeclarationRecord> {
  const row = {
    first_name:               payload.first_name.trim(),
    last_name:                payload.last_name.trim(),
    personal_identity_number: payload.personal_identity_number.replace(/\D/g, ''),
    user_email:               payload.user_email?.toLowerCase().trim() ?? null,
    user_phone:               payload.user_phone?.replace(/\s/g, '') ?? null,
    income_year:              payload.income_year,
    salary:                   n(payload.salary),
    travel_deduction:         n(payload.travel_deduction),
    other_work_expenses:      n(payload.other_work_expenses),
    rot_deduction:            n(payload.rot_deduction),
    rut_deduction:            n(payload.rut_deduction),
    rental_net:               n(payload.rental_net),
    capital_gain_funds:       n(payload.capital_gain_funds),
    capital_loss_funds:       n(payload.capital_loss_funds),
    interest_secured:         n(payload.interest_secured),
    interest_unsecured:       n(payload.interest_unsecured),
    housing_sale_price:       payload.housing_sale_price != null ? n(payload.housing_sale_price) : null,
    housing_buy_price:        payload.housing_buy_price  != null ? n(payload.housing_buy_price)  : null,
    housing_improvements:     payload.housing_improvements != null ? n(payload.housing_improvements) : null,
    housing_sale_costs:       payload.housing_sale_costs != null ? n(payload.housing_sale_costs) : null,
    raw_data: payload,
    status: 'submitted' as const,
  };

  const { data, error } = await supabase
    .from('declarations')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(`Databasfel: ${error.message}`);
  return data as DeclarationRecord;
}

export async function getDeclarationById(id: string): Promise<DeclarationRecord | null> {
  const { data, error } = await supabase
    .from('declarations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as DeclarationRecord;
}
