import bcrypt from 'bcrypt';
import { timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

const SALT_ROUNDS = 12;

export const validateBearerSecret = (request: NextRequest, secret: string | undefined): boolean => {
  const authHeader = request.headers.get('authorization');
  if (!secret || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
