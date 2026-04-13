import type { SubmissionPayload } from '../types/declaration';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// Personnummer: 12 siffror (med eller utan bindestreck/mellanslag)
const PNR_REGEX = /^\d{8}[-\s]?\d{4}$|^\d{12}$/;

// Enkel e-postvalidering
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Telefon: minst 7 siffror
const PHONE_REGEX = /\d{7,}/;

export function validateSubmission(body: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: { _root: 'Payload måste vara ett JSON-objekt.' } };
  }

  const p = body as Partial<SubmissionPayload>;

  // --- Obligatoriska textfält ---
  if (!p.first_name?.trim()) {
    errors.first_name = 'Förnamn är obligatoriskt.';
  }

  if (!p.last_name?.trim()) {
    errors.last_name = 'Efternamn är obligatoriskt.';
  }

  if (!p.personal_identity_number) {
    errors.personal_identity_number = 'Personnummer är obligatoriskt.';
  } else {
    const pnr = p.personal_identity_number.replace(/[\s-]/g, '');
    if (!PNR_REGEX.test(p.personal_identity_number) || (pnr.length !== 10 && pnr.length !== 12)) {
      errors.personal_identity_number = 'Ogiltigt personnummerformat. Ange 10 eller 12 siffror.';
    }
  }

  // --- Inkomstår ---
  if (!p.income_year) {
    errors.income_year = 'Inkomstår är obligatoriskt.';
  } else if (
    typeof p.income_year !== 'number' ||
    p.income_year < 2020 ||
    p.income_year > new Date().getFullYear()
  ) {
    errors.income_year = `Ogiltigt inkomstår. Måste vara mellan 2020 och ${new Date().getFullYear()}.`;
  }

  // --- Kontakt: minst e-post eller telefon ---
  const hasEmail = !!p.user_email?.trim();
  const hasPhone = !!p.user_phone?.trim();

  if (!hasEmail && !hasPhone) {
    errors.contact = 'Minst en kontaktuppgift krävs (e-post eller telefon).';
  }

  if (hasEmail && !EMAIL_REGEX.test(p.user_email!)) {
    errors.user_email = 'Ogiltig e-postadress.';
  }

  if (hasPhone && !PHONE_REGEX.test(p.user_phone!.replace(/\s/g, ''))) {
    errors.user_phone = 'Ogiltigt telefonnummer.';
  }

  // --- Numeriska fält: måste vara >= 0 om angivna ---
  const numericFields: Array<keyof SubmissionPayload> = [
    'salary',
    'travel_deduction',
    'other_work_expenses',
    'rot_deduction',
    'rut_deduction',
    'rental_net',
    'capital_gain_funds',
    'capital_loss_funds',
    'interest_secured',
    'interest_unsecured',
    'housing_sale_price',
    'housing_buy_price',
    'housing_improvements',
    'housing_sale_costs',
  ];

  for (const field of numericFields) {
    const val = p[field];
    if (val !== undefined && val !== null) {
      if (typeof val !== 'number' || val < 0 || !isFinite(val)) {
        errors[field] = `${field} måste vara ett positivt tal.`;
      }
    }
  }

  // --- Bostadsförsäljning: om ett K5-fält finns, kräv alla ---
  const k5Fields = ['housing_sale_price', 'housing_buy_price'] as const;
  const hasAnyk5 = k5Fields.some((f) => p[f] != null);
  if (hasAnyk5) {
    for (const f of k5Fields) {
      if (p[f] == null) {
        errors[f] = `${f} krävs om bostadsförsäljning anges.`;
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
