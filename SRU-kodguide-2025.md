# SRU-kodguide 2025 – Verifierade fältkoder INK1

## Källa: Officiell Skatteverket 2025P4-specifikation

Alla koder nedan är hämtade direkt från Skatteverkets zip-fil för 2025P4.
Filen heter: `INK1_SKV2000-35-02-0025-02.xls`

---

## Hur du hämtar den officiella specifikationen själv

### Steg för steg

**Steg 1 – Öppna rätt sida hos Skatteverket**

Gå till:
`skatteverket.se → Företag → Inkomstdeklaration → För redovisningsbyråer → Teknisk information om filöverföring`

Direktlänk: https://www.skatteverket.se/foretag/inkomstdeklaration/forredovisningsbyraer/tekniskinformationomfiloverforing.4.13948c0e18e810bfa0cca8.html

---

**Steg 2 – Ladda ner 2025P4-paketet**

På sidan finns en lista med zip-filer per år. Klicka på:

> **Ändringar från och med 2025P4 (zip, 6 MB)**

Direktlänk till filen:
`https://www.skatteverket.se/download/18.4e10387a1997767288d809/1762857356185/_Nyheter_from_beskattningsperiod_2025P4.zip`

---

**Steg 3 – Packa upp och öppna rätt fil**

Zip-filen innehåller 44 filer. De viktigaste för dig:

| Fil | Innehåll |
|---|---|
| `INK1_SKV2000-35-02-0025-02.xls` | Alla fältkoder för Inkomstdeklaration 1 (privatpersoner) |
| `K5_SKV2105-34-02-25-01.xls` | Fältkoder för bilaga K5 (bostadsförsäljning) |
| `K10_SKV2110-38-04-25-01.xls` | Fältkoder för K10 (fåmansbolag) |
| `K4_SKV2104-28-02-25-01.xls` | Fältkoder för K4 (aktier/fonder) |
| `NE_SKV2161-13-02-25-02.xls` | Fältkoder för NE-bilagan (enskild firma) |
| `_SKV269 blankettbilder med fältnamn 2025P4.pdf` | Visuell översikt med alla fältnamn på blanketterna |
| `_Nyheter_from_beskattningsperiod_2025P4.pdf` | Förändringar från föregående år |

Öppna `INK1_SKV2000-35-02-0025-02.xls` i Excel. Kolumnerna är:
- **Kolumn A** = Beskrivning (t.ex. "1.1 Lön, förmåner, sjukpenning m.m.")
- **Kolumn B** = Fältkod/fältnamn (t.ex. `1000`)
- **Kolumn C** = Datatyp

---

**Steg 4 – Hitta rätt kod**

Sök på nyckelord i kolumn A. Exempel:
- Sök "resa" → hittar kod `1070` (pendlingsavdrag)
- Sök "rot" → hittar kod `1583` (ROT-reduktion)
- Sök "uthyrning" → hittar kod `1101` (hyresintäkter)

---

## Verifierade fältkoder INK1 – Inkomstår 2025

Källa: `INK1_SKV2000-35-02-0025-02.xls` (2025P4)

| Kod | Beskrivning i deklarationen | Avsnitt INK1 | Status |
|---|---|---|---|
| **1000** | Lön, förmåner, sjukpenning m.m. | 1.1 | ✅ Verifierad |
| **1001** | Kostnadsersättningar | 1.2 | ✅ Verifierad |
| **1002** | Allmän pension och tjänstepension | 1.3 | ✅ Verifierad |
| **1070** | Resor till och från arbetet (pendlingsavdrag) | 2.1 | ✅ Verifierad |
| **1071** | Tjänsteresor | 2.2 | ✅ Verifierad |
| **1073** | Övriga utgifter för arbetet (fackavgift + redskap) | 2.4 | ✅ Verifierad |
| **1583** | Rotarbete (skattereduktion) | 4.1 | ✅ Verifierad |
| **1584** | Rutarbete (skattereduktion) | 4.2 | ✅ Verifierad |
| **1582** | Förnybar el (skattereduktion) | 4.3 | ✅ Verifierad |
| **1101** | Överskott vid uthyrning av privatbostad | 7.3 | ✅ Verifierad |
| **1102** | Vinst fondandelar m.m. (aktier/fonder via K4) | 7.4 | ✅ Verifierad |
| **1104** | Vinst från bilaga K5/K6 (bostadsförsäljning) | 7.6 | ✅ Verifierad |
| **1170** | Ränteutgifter – lån MED säkerhet (bolån) | 8.1 | ✅ Verifierad |
| **1172** | Förlust fondandelar m.m. (aktier/fonder) | 8.3 | ✅ Verifierad |
| **1174** | Förlust från bilaga K5/K6 (bostadsförsäljning) | 8.5 | ✅ Verifierad |
| **1177** | Ränteutgifter – lån UTAN säkerhet ⚠️ NY 2025 | 8.8 | ✅ Verifierad |
| **1200** | Överskott aktiv näringsverksamhet (enskild firma) | 10.1 | ✅ Verifierad |
| **1510** | Allmänna avdrag – underskott näringsverksamhet | 14.1 | ✅ Verifierad |

---

## Verifierade fältkoder K5 – Bostadsförsäljning

Källa: `K5_SKV2105-34-02-25-01.xls` (2025P4)

| Kod | Beskrivning |
|---|---|
| **3620** | 1. Försäljningspris |
| **3621** | 2. Försäljningsutgifter (mäklare, styling m.m.) |
| **3622** | 3. Inköpspris (inkl. lagfart, pantbrev, insats) |
| **3623** | 4. Förbättringsutgifter – ny-/tillbyggnad m.m. |
| **3624** | 5. Förbättringsutgifter – förbättrande reparationer |
| **3625** | 6. Vinst eller förlust |
| **3629** | 9. Vinst att föra till INK1 p.7.6 (kod 1104) |
| **3630** | 10. Förlust att föra till INK1 p.8.5 (kod 1174) |

**Viktig notering K5:** K5 är en SEPARAT bilaga (eget `#BLANKETT K5`-block i SRU-filen). Vinsten/förlusten förs sedan över till INK1 via kod 1104/1174. Det är K5 som tillämpar 22/30-regeln och eventuellt uppskov – inte INK1 direkt.

---

## Viktigaste förändringen för 2025: Ränteavdrag

Ny lag från inkomstår 2025 (`_Nyheter_from_beskattningsperiod_2025P4.pdf`):

**Ränteutgifter delas nu upp i två separata fält:**

| Kod | Typ | Avdragsgill andel 2025 | Effektiv skatteeffekt |
|---|---|---|---|
| `1170` | Lån med säkerhet (bolån, pantbrevslån) | 100% | 30% (upp till 100 000 kr) |
| `1177` | Lån utan säkerhet (blancolån, privatlån) | 50% | ca 15% |

Tidigare var allt under ett och samma fält. Nu måste lånen separeras.

**Praktregel:** Bolån → alltid till 1170. Privatlån, konsumtionslån, blancolån → 1177.

---

## Vad som var fel i originalformuläret (rättat)

| Post | Gammal kod (FEL) | Ny kod (RÄTT) |
|---|---|---|
| Löneinkomst | 1010 | **1000** |
| Pendlingsavdrag | 3990 | **1070** |
| Fackavgift/övriga avdrag | 1111 | **1073** |
| Arbetsredskap | 3020 | **1073** (kombineras med fackavgift) |
| ROT skattereduktion | 2450 (combined) | **1583** |
| RUT skattereduktion | 2450 (combined) | **1584** |
| Ränteutgifter (bolån) | 8010 | **1170** |
| Ränteutgifter blancolån | Saknades | **1177** (ny 2025) |
| Kapitalvinst aktier/fonder | 4510 | **1102** |
| Kapitalförlust aktier/fonder | 4520 | **1172** |
| Bostadsförsäljning vinst | 4610 | **1104** (+ separat K5-bilaga) |
| Hyresintäkter | 7100 | **1101** |

---

## Filstruktur BLANKETTER.SRU

Vid inlämning via Skatteverkets filöverföringstjänst ska du skicka **två filer**:

**INFO.SRU** – uppgifter om den som lämnar in
```
#DATABESKRIVNING
#PRODUKT Ditt Programnamn
#SKAPAD 20260501
#DATABESKRIVNINGSLUT
```

**BLANKETTER.SRU** – innehåller alla blanketters data
```
#BLANKETT INK1
#IDENTITET 19800101-1234 20260501
#UPPGIFT 1000 480000
#UPPGIFT 1070 8400
...
#BLANKETTSLUT

#BLANKETT K5
#IDENTITET 19800101-1234 20260501
#UPPGIFT 3620 3200000
...
#BLANKETTSLUT

#FIL_SLUT
```

Max filstorlek BLANKETTER.SRU: **5 MB**. Byt inte namn på filerna – det bryter filöverföringen.

---

## Ombud: Filöverföringstjänsten

För att lämna in via filöverföringstjänsten som ombud:
1. Logga in på skatteverket.se med e-legitimation
2. Gå till: Företag → E-tjänster → Filöverföring
3. Välj "Inkomstdeklaration" som typ
4. Ladda upp INFO.SRU + BLANKETTER.SRU
5. Bekräfta inlämningen

Kräver: registrerat ombudsskap för respektive person (se ombud-instruktioner i formuläret).

---

*Verifierat mot Skatteverkets 2025P4-specifikation, hämtad april 2026.*
*Uppdatera mot ny specifikation varje år (brukar publiceras oktober–november).*
