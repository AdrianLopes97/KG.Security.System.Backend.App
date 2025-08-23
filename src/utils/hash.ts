import bcrypt from "bcrypt";

export function hash(password: string) {
  return bcrypt.hash(password, 10);
}

export function compare(password: string, encrypted: string) {
  return bcrypt.compare(password, encrypted);
}
