import { NextRequest, NextResponse } from 'next/server';
import { validateSubmission } from '@/lib/validation/submission';
import { createDeclaration } from '@/lib/db/declarations';
import type { SubmitResponse, ErrorResponse } from '@/lib/types/declaration';

// POST /api/submit
// Tar emot formulärpayload, validerar, sparar och returnerar referensnummer.
export async function POST(req: NextRequest) {
  // --- Parsa body ---
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json<ErrorResponse>(
      { success: false, error: 'Ogiltig JSON i request body.' },
      400
    );
  }

  // --- Validera ---
  const { valid, errors } = validateSubmission(body);
  if (!valid) {
    return json<ErrorResponse>(
      {
        success: false,
        error: 'Validering misslyckades. Kontrollera fälten nedan.',
        details: errors,
      },
      422
    );
  }

  // --- Spara ---
  let record;
  try {
    record = await createDeclaration(body as Parameters<typeof createDeclaration>[0]);
  } catch (err) {
    console.error('[submit] DB-fel:', err);
    return json<ErrorResponse>(
      { success: false, error: 'Internt serverfel. Försök igen om en stund.' },
      500
    );
  }

  // --- Svar ---
  return json<SubmitResponse>(
    {
      success: true,
      submission_id:    record.id,
      reference_number: record.reference_number,
      status:           record.status,
    },
    201
  );
}

// Hjälpfunktion: typsäkert JSON-svar
function json<T>(data: T, status: number) {
  return NextResponse.json(data, { status });
}
