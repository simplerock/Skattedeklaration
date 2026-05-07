# Automation Pipeline: Formulär → SRU → Skatteverket

## Hur SRU-filer fungerar

SRU (Standardiserad RäkenskapsUtdrag) är det textformat Skatteverket accepterar för elektronisk inlämning. Det är exakt det format bokföringsprogram som Visma, Fortnox och Björn Lundén använder varje år.

En SRU-fil är ren text med fältkoder. Exempel på hur en Inkomstdeklaration 1 (INK1) ser ut:

```
#BLANKETT INK1
#IDENTITET 19800101-1234 20250501
#NAMN Svensson, Anna
#UPPGIFT 1010 480000    (Löneinkomst)
#UPPGIFT 1110 3600      (Fackavgift)
#UPPGIFT 2420 48000     (Räntekostnader)
#UPPGIFT 2450 15000     (ROT-avdrag)
#UPPGIFT 3990 4200      (Pendlingsavdrag)
#BLANKETTSLUT
#FIL_SLUT
```

Varje `#UPPGIFT`-rad har en fältkod som mappar direkt till en ruta i Skatteverkets deklaration.

---

## Viktiga fältkoder INK1 (urval)

| Fältkod | Beskrivning |
|---|---|
| 1010 | Lön och liknande ersättningar |
| 1110 | Fackavgift / a-kassa |
| 2420 | Räntekostnader (kapital) |
| 2450 | Skattereduktion ROT/RUT |
| 3990 | Avdrag för resor till arbetet |
| 4510 | Kapitalvinst aktier |
| 4520 | Kapitalförlust aktier (70%) |
| 7011 | Inkomst av tjänst (lön) |
| 7650 | Ränteavdrag |

Komplett lista finns i Skatteverkets tekniska specifikation:
`skatteverket.se → Företag → Deklarera → Teknisk information → SRU-filer`

---

## Pipeline: Steg för steg

```
1. FORMULÄR (HTML)
   Användaren fyller i data
   ↓ JSON-export

2. VALIDERING
   Kontrollera att nödvändiga fält finns
   Beräkna alla avdrag
   ↓ Strukturerad datamodell

3. SRU-GENERERING (Python/Node)
   Mappa fält → fältkoder
   Generera .sru-textfil
   ↓ .sru-fil

4. INLÄMNING
   Alt A: Guidad → användaren laddar upp via Mina sidor
   Alt B: Ombud API → du laddar upp med fullmakt
   ↓ Bekräftelse från Skatteverket
```

---

## Pythonkod: JSON → SRU-fil

```python
import json
from datetime import datetime

def generate_sru(data: dict) -> str:
    """
    Konverterar formulärdata (JSON) till SRU-format för INK1.
    """
    pnr = data.get("personnummer", "").replace("-", "")
    datum = datetime.now().strftime("%Y%m%d")
    lines = []

    lines.append("#BLANKETT INK1")
    lines.append(f"#IDENTITET {data['personnummer']} {datum}")

    # Löneinkomst
    lon = data.get("ab", {}).get("lon") or 0
    if lon:
        lines.append(f"#UPPGIFT 1010 {int(lon)}")

    # Fackavgift
    fack = data.get("fackavgift", {})
    if fack.get("aktiv") and fack.get("belopp"):
        lines.append(f"#UPPGIFT 1110 {int(fack['belopp'])}")

    # Pendlingsavdrag
    pendling = data.get("pendling", {})
    km = float(pendling.get("km") or 0)
    dagar = float(pendling.get("dagar") or 220)
    typ = pendling.get("typ", "")
    if km > 0 and typ:
        if typ == "bil":
            kostnad = km * 2 * dagar * 2.50
        else:
            kostnad = km * 2 * dagar * 1.20
        avdrag = max(0, kostnad - 11000)
        if avdrag > 0:
            lines.append(f"#UPPGIFT 3990 {int(avdrag)}")

    # Räntekostnader
    ranta = data.get("ranta", {}).get("belopp") or 0
    if ranta:
        lines.append(f"#UPPGIFT 2420 {int(ranta)}")

    # ROT/RUT (skattereduktion)
    rot_kr = float(data.get("rot", {}).get("belopp") or 0)
    rut_kr = float(data.get("rut", {}).get("belopp") or 0)
    rot_reduktion = min(rot_kr * 0.30, 50000)
    rut_reduktion = min(rut_kr * 0.50, 75000)
    total_reduktion = rot_reduktion + rut_reduktion
    if total_reduktion > 0:
        lines.append(f"#UPPGIFT 2450 {int(total_reduktion)}")

    # Kapitalvinst aktier
    kapital = data.get("kapital", {})
    vinst = float(kapital.get("vinst") or 0)
    forlust = float(kapital.get("forlust") or 0)
    if vinst:
        lines.append(f"#UPPGIFT 4510 {int(vinst)}")
    if forlust:
        lines.append(f"#UPPGIFT 4520 {int(forlust)}")

    lines.append("#BLANKETTSLUT")
    lines.append("#FIL_SLUT")

    return "\n".join(lines)


def save_sru(data: dict, output_path: str):
    sru_content = generate_sru(data)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(sru_content)
    print(f"SRU-fil sparad: {output_path}")
    return sru_content


# Användning:
# with open("deklaration-198001011234-2024.json") as f:
#     data = json.load(f)
# save_sru(data, "INK1_198001011234.sru")
```

---

## Inlämning: Tre alternativ

### Alt 1 – Guidad egeninlämning (MVP, ingen registrering krävs)

1. Generera SRU-filen
2. Skicka till användaren med instruktioner:
   - Logga in på skatteverket.se med BankID
   - Gå till Mina sidor → Deklaration → Ladda upp fil
   - Ladda upp .sru-filen
   - Godkänn och skicka in

**Nackdel:** Användaren måste agera. Kräver BankID-inloggning.

---

### Alt 2 – Ombud med fullmakt (fullt automatiserad)

**Krav:**
1. Registrera dig som **ombud** hos Skatteverket
2. Låt användaren ge dig **fullmakt** via Skatteverkets fullmaktstjänst (BankID-signerat digitalt)
3. Ladda upp SRU-filen via **Filöverföringstjänsten** med ditt ombuds-certifikat

**Filöverföringstjänsten:**
- URL: `https://www.skatteverket.se/foretagochorganisationer/...`
- Kräver: SITHS-kort eller tjänstelegitimation (för företag/ombud)
- Format: .sru-fil, max 10 MB

**Steg för att bli ombud:**
1. Ansök via Skatteverkets e-tjänst "Fullmakt och ombud"
2. Verifiera organisationsnummer
3. Skatteverket godkänner ombudsstatus (normalt 1–2 veckor)

---

### Alt 3 – API (mest skalbart, kräver avtal)

Skatteverket har ett **Inrapporterings-API** för auktoriserade aktörer.

- Kräver avtal med Skatteverket
- Passar för licensierade redovisningsbyråer / revisionsbolag
- REST API med OAuth 2.0 autentisering
- Möjliggör batch-inlämning för många kunder

Mer info: Skatteverkets API-portal och kontakt via `api@skatteverket.se`

---

## Dataskydd & GDPR – obligatoriskt

Personnummer och skattedata klassas som **känslig personuppgift** i Sverige.

**Du måste:**
- Ha tydlig integritetspolicy
- Lagra data krypterat (AES-256 minimum)
- Begränsa åtkomst – bara de som behöver det
- Radera data efter att deklarationen är inlämnad (eller på begäran)
- Ha ett DPA (Databehandlingsavtal) om du anlitar underleverantörer
- Anmäla personuppgiftsincidenter till IMY inom 72 timmar

**Rekommendation:** Anlita en GDPR-jurist för genomgång innan lansering.

---

## Tidslinje för deklarationsåret

| Datum | Händelse |
|---|---|
| Mars | Skatteverket skickar ut förifylld deklaration |
| Tidigt april | Öppna formuläret för datainsamling |
| 2 maj | Inlämningsfrist för privatpersoner |
| Juni–aug | Skatteåterbäring betalas ut |

Börja samla data i mars. Sikta på inlämning senast 25 april för att ha buffert.

---

*Teknisk specifikation för SRU-filer: skatteverket.se → Teknisk information → Filformat och blanketter*
