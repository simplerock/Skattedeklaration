export type DeclarationStatus = 'submitted' | 'processing' | 'completed' | 'error';

export interface SubmissionPayload {
  first_name: string;
  last_name: string;
  personal_identity_number: string;
  income_year: number;
  user_email?: string;
  user_phone?: string;
  salary?: number;
  travel_deduction?: number;
  other_work_expenses?: number;
  rot_deduction?: number;
  rut_deduction?: number;
  rental_net?: number;
  capital_gain_funds?: number;
  capital_loss_funds?: number;
  interest_secured?: number;
  interest_unsecured?: number;
  housing_sale_price?: number;
  housing_buy_price?: number;
  housing_improvements?: number;
  housing_sale_costs?: number;
  consented_at?: string;
}

export interface DeclarationRecord {
  id: string;
  created_at: string;
  updated_at: string;
  status: DeclarationStatus;
  reference_number: string;
  first_name: string;
  last_name: string;
  personal_identity_number: string;
  user_email: string | null;
  user_phone: string | null;
  income_year: number;
  salary: number;
  travel_deduction: number;
  other_work_expenses: number;
  rot_deduction: number;
  rut_deduction: number;
  rental_net: number;
  capital_gain_funds: number;
  capital_loss_funds: number;
  interest_secured: number;
  interest_unsecured: number;
  housing_sale_price: number | null;
  housing_buy_price: number | null;
  housing_improvements: number | null;
  housing_sale_costs: number | null;
  address: string | null;
  postnummer: string | null;
  postort: string | null;
  raw_data: SubmissionPayload;
}

export interface SubmitResponse {
  success: true;
  submission_id: string;
  reference_number: string;
  status: DeclarationStatus;
}

export interface ErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string>;
}
