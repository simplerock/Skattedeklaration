# Backend setup — Deklarationstjänsten

## Stack
- Next.js 14+ (App Router, Route Handlers)
- TypeScript
- Supabase (Postgres)

## Mappstruktur

```
app/
  api/
    submit/
      route.ts          ← POST /api/submit
lib/
  db/
    supabase.ts         ← Supabase-klient (service role)
    declarations.ts     ← DB-operationer
  validation/
    submission.ts       ← Payload-validering
  types/
    declaration.ts      ← Typer och interfaces
supabase/
  migrations/
    001_declarations.sql ← Kör i Supabase SQL Editor
.env.local.example      ← Kopiera till .env.local och fyll i
```

## Kom igång

### 1. Installera beroenden
```bash
npm install @supabase/supabase-js
```

### 2. Miljövariabler
Kopiera `.env.local.example` till `.env.local` och fyll i dina Supabase-nycklar.
Hämta dem från: Supabase Dashboard → Project Settings → API.

### 3. Databas
Kör `supabase/migrations/001_declarations.sql` i Supabase SQL Editor.
Det skapar tabellen, index, RLS och referensnummer-generatorn.

### 4. Starta
```bash
npm run dev
```

## Endpoint

### POST /api/submit

**Request body (JSON):**
```json
{
  "first_name": "Anna",
  "last_name": "Svensson",
  "personal_identity_number": "198501011234",
  "income_year": 2025,
  "user_email": "anna@exempel.se",
  "salary": 520000,
  "travel_deduction": 30800,
  "rot_deduction": 25500,
  "interest_secured": 54000
}
```

**Lyckat svar (201):**
```json
{
  "success": true,
  "submission_id": "uuid-...",
  "reference_number": "DKL-20260412-A3F9C2",
  "status": "submitted"
}
```

**Valideringsfel (422):**
```json
{
  "success": false,
  "error": "Validering misslyckades. Kontrollera fälten nedan.",
  "details": {
    "user_email": "Ogiltig e-postadress.",
    "income_year": "Ogiltigt inkomstår."
  }
}
```

## Nästa steg
- [ ] SRU-generator (läser från declarations-tabellen)
- [ ] Storage för genererade filer (Supabase Storage)
- [ ] Admin endpoints (lista, hämta, uppdatera status)
- [ ] Webhook när status ändras
