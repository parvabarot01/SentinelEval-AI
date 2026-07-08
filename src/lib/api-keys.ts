import { randomBytes, createHash } from "crypto";

const PREFIX = "sk_sentinel_";

export function generateApiKey(): { plaintext: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString("hex");
  const plaintext = `${PREFIX}${secret}`;
  return { plaintext, hash: hashApiKey(plaintext), prefix: plaintext.slice(0, PREFIX.length + 6) };
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}
