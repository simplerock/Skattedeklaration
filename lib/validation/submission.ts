import type { SubmissionPayload } from '../types/declaration';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /\d{7,}/;

export function validateSubmission(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _root: 'Payload måste vara ett JSON-objekt.' } };
  }

  const p = body as Partial<SubmissionPayload>;

  if (!p.first_name?.trim())    errors.first_name = 'Förnamn är obligatoriskt.';
  if (!p.last_name?.trim())     errors.last_name  = 'Efternamn är obligatoriskt.';

  if (!p.personal_identity_number) {
    errors.personal_identity_number = 'Personnummer är obligatoriskt.';
  } else {
    const pnr = p.personal_identity_number.replace(/[\s-]/g, '');
    if (pnr.length !== 10 && pnr.length !== 12) {
      errors.personal_identity_number = 'Ogiltigt personnummerformat. Ange 10 eller 12 siffror.';
    }
  }

  if (!p.income_year) {
    errors.income_year = 'Inkomstår är obligatoriskt.';
  } else if (typeof p.income_year !== 'number' || p.income_year < 2020 || p.income_year > new Date().getFullYear()) {
    errors.income_year = `Ogiltigt inkomstår.`;
  }

  const hasEmail = !!p.user_email?.trim();
  const hasPhone = !!p.user_phone?.trim();
  if (!hasEmail && !hasPhone) errors.contact = 'Minst e-post eller telefon krävs.';
  if (hasEmail && !EMAIL_REGEX.test(p.user_email!)) errors.user_email = 'Ogiltig e-postadress.';
  if (hasPhone && !PHONE_REGEX.test(p.user_phone!.replace(/\s/g, ''))) errors.user_phone = 'Ogiltigt telefonnummer.';

  const numFields = ['salary','travel_deduction','other_work_expenses','rot_deduction',
    'rut_deduction','rental_net','capital_gain_funds','capital_loss_funds',
    'interest_secured','interest_unsecured','housing_sale_price','housing_buy_price',
    'housing_improvements','housing_sale_costs'] as const;

  for (const field of numFields) {
    const val = p[field];
    if (val !== undefined && val !== null && (typeof val !== 'number' || val < 0 || !isFinite(val))) {
      errors[field] = `${field} måste vara ett positivt tal.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
