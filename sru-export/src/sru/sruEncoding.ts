/**
 * SRU encoding utilities.
 *
 * SRU files must be ISO 8859-1 (Latin-1) encoded.
 * Swedish characters (å, ä, ö, Å, Ä, Ö) are all within Latin-1.
 *
 * In a Node.js context we can use Buffer.from(str, 'latin1').
 * In a browser context we work with strings and let the download layer handle encoding.
 */

/**
 * Validate that a string is safe for ISO 8859-1 encoding.
 * Returns characters that are outside the Latin-1 range.
 */
export function findNonLatin1Characters(str: string): string[] {
  const invalid: string[] = [];
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code > 255) {
      if (!invalid.includes(char)) {
        invalid.push(char);
      }
    }
  }
  return invalid;
}

/**
 * Replace non-Latin-1 characters with closest ASCII equivalents.
 * Only applies to characters outside the 0-255 range.
 */
export function sanitizeForLatin1(str: string): string {
  let result = '';
  for (const char of str) {
    const code = char.charCodeAt(0);
    if (code <= 255) {
      result += char;
    } else {
      // Replace with '?' for unknown characters
      result += '?';
    }
  }
  return result;
}

/**
 * Encode SRU content to a Buffer (Node.js only).
 * For browser usage, return the string as-is and handle encoding at download time.
 */
export function encodeToLatin1Buffer(content: string): Buffer {
  return Buffer.from(content, 'latin1');
}
