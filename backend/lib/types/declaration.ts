// ============================================================
// Typer för deklarationsärenden
// ============================================================

export type DeclarationStatus = 'submitted' | 'processing' | 'completed' | 'error';

// Payload som frontend skickar
export interface SubmissionPayload {
  // Obligatoriska identitetsfält
  first_name: string;
  last_name: string;
  personal_identity_number: string; // 12 siffror, utan bindestreck
  income_year: number;              // t.ex. 2025

  // Kontakt (minst ett krävs)
  user_email?: string;
  user_phone?: string;

  // Avdrag och inkomster (valfria, 0 om ej aktuellt)
  salary?: number;
  travel_deduction?: number;       // Pendlingsavdrag (fält 1070)
  other_work_expenses?: number;    // Övriga tjänsteutgifter (fält 1073)
  rot_deduction?: number;          // ROT reducering (fält 1583)
  rut_deduction?: number;          // RUT reducering (fält 1584)
  rental_net?: number;             // Uthyrning netto (fält 1101)
  capital_gain_funds?: number;     // Kapitalvinst fonder (fält 1102)
  capital_loss_funds?: number;     // Kapitalförlust fonder (fält 1172)
  interest_secured?: number;       // Bolåneränta (fält 1170)
  interest_unsecured?: number;     // Blancolåneränta (fält 1177)

  // Bostadsförsäljning K5
  housing_sale_price?: number;
  housing_buy_price?: number;
  housing_improvements?: number;
  housing_sale_costs?: number;

  // Godkännande
  consented_at?: string;           // ISO 8601 timestamp
}

// Vad som sparas i databasen
export interface DeclarationRecord {
  id: string;
  created_at: string;
  updated_at: string;
  status: DeclarationStatus;
  reference_number: string;

  // Personuppgifter
  first_name: string;
  last_name: string;
  personal_identity_number: string;
  user_email: string | null;
  user_phone: string | null;
  income_year: number;

  // Avdrag (extraherade kolumner)
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

  // Rådata — sanningen
  raw_data: SubmissionPayload;
}

// Svar till frontend
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
