import { ulid } from 'ulid';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateId(): string {
  return ulid();
}

export function generateAccessCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}
