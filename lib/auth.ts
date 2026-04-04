import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { connectDB } from './db';
import { User, IUser } from './models/User';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'nebula-secret-key-change-in-production');

export interface JWTPayload {
  userId: string;
  email: string;
  exp?: number;
}

export async function signToken(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  return { userId: payload.userId, email: payload.email };
}

export async function getCurrentUser(): Promise<IUser | null> {
  const session = await getSession();
  if (!session) return null;
  
  await connectDB();
  const user = await User.findById(session.userId);
  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
