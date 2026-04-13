// SRU Core — single source of truth for SRU file generation
// Used by deklarationsformular.html, admin.html, and lib/sru/generator.ts (keep in sync)
// Skatteverket SKV 269 specification
var SruCore = (function () {
  'use strict';

  // --- Blankett period tokens ---
  // Skatteverket requires period tokens, e.g. INK1-2025P4.
  // Plain type codes (INK1) are rejected: "tillhör en period som inte är öppen för inlämning"
  var BLANKETT_PERIOD_TOKENS = {
    INK1: 'INK1-2025P4',
    K4:   'K4-2025P4',
    K5:   'K5-2025P4',
    K10:  'K10-2025P4',
    NE:   'NE-2025P4',
  };

  function getBlankettToken(formType) {
    var token = BLANKETT_PERIOD_TOKENS[formType];
    if (!token) throw new Error('Okänd blanketttyp: ' + formType + '. Lägg till i BLANKETT_PERIOD_TOKENS.');
    return token;
  }

  // --- Personnummer ---
  function sruPnr12(raw) {
    var digits = (raw || '').replace(/\D/g, '');
    if (digits.length === 12) return digits;
    if (digits.length === 10) {
      var yy = parseInt(digits.slice(0, 2), 10);
      var currentYY = new Date().getFullYear() % 100;
      return (yy <= currentYY ? '20' : '19') + digits;
    }
    return digits;
  }

  // --- Date/time ---
  function sruNow() {
    var now = new Date();
    var d = now.toISOString().slice(0, 10).replace(/-/g, '');
    var t = now.toTimeString().slice(0, 8).replace(/:/g, '');
    return { date: d, time: t };
  }

  // --- INFO.SRU ---
  // data: { pnr, namn, address?, postnummer, postort, kontakt, programName? }
  function buildInfoSru(data) {
    var lines = [
      '#DATABESKRIVNING_START',
      '#PRODUKT SRU',
      '#SKAPAD ' + sruNow().date,
      '#PROGRAM ' + (data.programName || 'Skattedeklaration 1.0'),
      '#FILNAMN BLANKETTER.SRU',
      '#DATABESKRIVNING_SLUT',
      '#MEDIELEV_START',
      '#ORGNR ' + data.pnr,
      '#NAMN ' + data.namn,
    ];
    if (data.address) lines.push('#ADRESS ' + data.address);
    if (!data.postnummer || data.postnummer === '00000') {
      throw new Error('Postnummer saknas.');
    }
    lines.push('#POSTNR ' + data.postnummer);
    if (!data.postort) {
      throw new Error('Ort saknas.');
    }
    lines.push('#POSTORT ' + data.postort);
    if (data.kontakt) lines.push('#KONTAKT ' + data.kontakt);
    lines.push('#MEDIELEV_SLUT');
    return lines.join('\n') + '\n';
  }

  // --- Single blankett block ---
  // formType: 'INK1', 'K5', 'K4', etc.
  // identity: { pnr, namn, date, time }
  // fields: array of [fieldCode, value] — only values > 0 are emitted
  function buildBlankett(formType, identity, fields) {
    var lines = [
      '#BLANKETT ' + getBlankettToken(formType),
      '#IDENTITET ' + identity.pnr + ' ' + identity.date + ' ' + identity.time,
    ];
    if (identity.namn) lines.push('#NAMN ' + identity.namn);
    for (var i = 0; i < fields.length; i++) {
      var code = fields[i][0];
      var val = fields[i][1];
      if (val !== 0 && val != null) {
        lines.push('#UPPGIFT ' + code + ' ' + Math.round(val));
      }
    }
    lines.push('#BLANKETTSLUT');
    return lines;
  }

  // --- Full BLANKETTER.SRU ---
  // blankettBlocks: array of line arrays (from buildBlankett)
  function buildBlanketterSru(blankettBlocks) {
    var allLines = [];
    for (var i = 0; i < blankettBlocks.length; i++) {
      allLines = allLines.concat(blankettBlocks[i]);
    }
    allLines.push('#FIL_SLUT');
    return allLines.join('\n') + '\n';
  }

  // --- ISO 8859-1 encoding (browser only) ---
  function toISO88591Blob(text) {
    var bytes = new Uint8Array(text.length);
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      bytes[i] = code <= 0xFF ? code : 0x3F; // outside ISO 8859-1 → '?'
    }
    return new Blob([bytes], { type: 'text/plain;charset=iso-8859-1' });
  }

  // --- Download helper (browser only) ---
  function triggerDownload(content, filename) {
    var blob = toISO88591Blob(content);
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  return {
    BLANKETT_PERIOD_TOKENS: BLANKETT_PERIOD_TOKENS,
    getBlankettToken: getBlankettToken,
    sruPnr12: sruPnr12,
    sruNow: sruNow,
    buildInfoSru: buildInfoSru,
    buildBlankett: buildBlankett,
    buildBlanketterSru: buildBlanketterSru,
    toISO88591Blob: toISO88591Blob,
    triggerDownload: triggerDownload,
  };
})();
