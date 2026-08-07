import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const JWT_SECRET = process.env.JWT_SECRET || 'lifeos_secret_key_2026_hikari';
const MAGIC_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 Minutes

export interface JwtPayloadData {
  userId: string;
  email: string;
  name: string;
  telegramChatId?: string;
}

/**
 * 1. Generate Telegram Magic Login Token (Persistent in PostgreSQL DB)
 */
export async function generateMagicLinkToken(telegramChatId: bigint): Promise<{
  token: string;
  magicLinkUrl: string;
  expiresAt: number;
  userName: string;
}> {
  // Find linked user
  const link = await prisma.telegramLink.findUnique({
    where: { telegramChatId },
    include: { user: true },
  });

  let userId: string;
  let userName: string;

  if (link && link.user) {
    userId = link.userId;
    userName = link.user.name;
  } else {
    // If not linked yet, resolve or create default user
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
      userName = firstUser.name;
    } else {
      const newUser = await prisma.user.create({
        data: {
          email: `tg_${telegramChatId}@lifeos.internal`,
          name: `User ${telegramChatId}`,
        },
      });
      userId = newUser.id;
      userName = newUser.name;
    }
  }

  const token = `magic_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  const expiresAt = new Date(Date.now() + MAGIC_TOKEN_TTL_MS);

  // Save to PostgreSQL database (survives server restarts)
  await (prisma as any).magicToken.create({
    data: {
      token,
      chatId: telegramChatId,
      userId,
      expiresAt,
    },
  });

  const frontendUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://127.0.0.1:3001';
  const magicLinkUrl = `${frontendUrl}/auth/callback?token=${token}`;

  return { token, magicLinkUrl, expiresAt: expiresAt.getTime(), userName };
}

/**
 * 2. Verify Magic Link Token from PostgreSQL & Issue 30-Day Permanent Session JWT
 */
export async function verifyMagicLinkToken(token: string): Promise<{
  success: boolean;
  jwtToken?: string;
  user?: { id: string; name: string; email: string };
  message?: string;
}> {
  const record = await (prisma as any).magicToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return { success: false, message: 'Magic link token tidak ditemukan atau sudah digunakan.' };
  }

  if (new Date() > new Date(record.expiresAt)) {
    await (prisma as any).magicToken.delete({ where: { id: record.id } }).catch(() => {});
    return { success: false, message: 'Magic link token sudah kadaluwarsa (berlaku 15 menit).' };
  }

  // Delete token from DB (one-time use)
  await (prisma as any).magicToken.delete({ where: { id: record.id } }).catch(() => {});

  const user = record.user;

  if (!user) {
    return { success: false, message: 'Pengguna tidak ditemukan di database.' };
  }

  // Ensure Telegram link is marked active
  await prisma.telegramLink.upsert({
    where: { telegramChatId: record.chatId },
    create: {
      userId: user.id,
      telegramChatId: record.chatId,
      isActive: true,
    },
    update: {
      userId: user.id,
      isActive: true,
    },
  });

  // Issue 30-Day JWT Session Token
  const payload: JwtPayloadData = {
    userId: user.id,
    email: user.email,
    name: user.name,
    telegramChatId: record.chatId.toString(),
  };

  const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

  return {
    success: true,
    jwtToken,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

/**
 * 3. Verify JWT Session Token
 */
export function verifyJwtSessionToken(token: string): JwtPayloadData | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayloadData;
    return decoded;
  } catch (error) {
    return null;
  }
}
