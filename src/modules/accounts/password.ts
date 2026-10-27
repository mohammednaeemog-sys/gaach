import bcrypt from "bcryptjs";

// bcrypt salts each hash itself (NFR-3.1).
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Returns a message describing what is missing, or null if the password is strong enough.
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password))
    return "Use both letters and numbers.";
  const common = ["password1", "12345678a", "qwerty123", "abc12345"];
  if (common.includes(password.toLowerCase())) return "This password is too common.";
  return null;
}
