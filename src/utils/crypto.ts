import crypto from "node:crypto";
import { env } from "~/env";

const encryptionMethod = "aes-256-cbc";

const key = crypto
  .createHash("sha512")
  .update(env.CRYPTO_SECRET_KEY)
  .digest("hex")
  .substring(0, 32);

const encryptionIV = crypto
  .createHash("sha512")
  .update(env.CRYPTO_SECRET_IV)
  .digest("hex")
  .substring(0, 16);

export function encrypt(data: string): string {
  const cipher = crypto.createCipheriv(encryptionMethod, key, encryptionIV);

  return Buffer.from(
    cipher.update(data, "utf8", "hex") + cipher.final("hex"),
  ).toString("base64");
}

export function decrypt(data: string): string {
  const decipher = crypto.createDecipheriv(encryptionMethod, key, encryptionIV);

  return (
    decipher.update(
      Buffer.from(data, "base64").toString("utf8"),
      "hex",
      "utf8",
    ) + decipher.final("utf8")
  );
}
