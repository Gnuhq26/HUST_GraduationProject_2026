import * as crypto from 'crypto';

const DISPLAY_ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const DISPLAY_ID_LENGTH = 7;
const MAX_ATTEMPTS = 10;

export interface DisplayIdStoreLookup {
  findUnique(args: {
    where: { DisplayId: string };
  }): Promise<{ StoreID: number } | null>;
}

/**
 * Generate a unique 7-character alphanumeric DisplayId for a store URL.
 * Uses cryptographically random bytes, retries on collision.
 */
export async function generateUniqueDisplayId(
  lookup: DisplayIdStoreLookup,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const bytes = crypto.randomBytes(DISPLAY_ID_LENGTH);
    const id = Array.from(bytes)
      .map((b) => DISPLAY_ID_CHARS[b % DISPLAY_ID_CHARS.length])
      .join('');

    const existing = await lookup.findUnique({ where: { DisplayId: id } });
    if (!existing) return id;
  }

  throw new Error(
    `Failed to generate unique DisplayId after ${MAX_ATTEMPTS} attempts`,
  );
}
