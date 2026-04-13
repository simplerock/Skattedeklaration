import { NextRequest, NextResponse } from 'next/server';
import { validateSubmission } from '@/lib/validation/submission';
import { createDeclaration } from '@/lib/db/declarations';
import type { SubmitResponse, ErrorResponse } from '@/lib/types/declaration';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json<ErrorResponse>({ success: false, error: 'Ogiltig JSON.' }, 400);
  }

  const { valid, errors } = validateSubmission(body);
  if (!valid) {
    return json<ErrorResponse>({ success: false, error: 'Validering misslyckades.', details: errors }, 422);
  }

  let record;
  try {
    record = await createDeclaration(body as Parameters<typeof createDeclaration>[0]);
  } catch (err) {
    console.error('[submit] DB-fel:', err);
    return json<ErrorResponse>({ success: false, error: 'Internt serverfel.' }, 500);
  }

  return json<SubmitResponse>({
    success: true,
    submission_id:    record.id,
    reference_number: record.reference_number,
    status:           record.status,
  }, 201);
}

function json<T>(data: T, status: number) {
  return NextResponse.json(data, { status });
}
