import type { SruFile } from '../domain/declaration';
import { assertValidSruFileName } from './sruFileNames';

/**
 * Final serialization step.
 * Validates filenames one last time before returning.
 */
export function serializeSruFile(
  name: string,
  content: string
): SruFile {
  assertValidSruFileName(name);

  if (!content || content.trim().length === 0) {
    throw new Error(`SRU file "${name}" has empty content — this would be rejected by Skatteverket`);
  }

  return {
    name: name as SruFile['name'],
    content,
  };
}
