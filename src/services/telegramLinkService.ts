import crypto from 'crypto';
import { prisma } from '../server';

interface PendingToken {
  token: string;
  userId: string;
  expiresAt: number;
}

// In-memory token store (5 minute TTL)
const tokenStore = new Map<string, PendingToken>();

/**
 * Generate a 5-minute one-time link token for Telegram account linking
 */
export async function generateLinkToken(userId: string): Promise<{
  token: string;
  expiresAt: number;
  botUsername: string;
}> {
  // Clean expired tokens
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  }

  // Generate random token string
  const token = `link_${crypto.randomBytes(4).toString('hex')}`;
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes

  tokenStore.set(token, { token, userId, expiresAt });

  const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'LifeOSPlatformBot';

  return { token, expiresAt, botUsername };
}

/**
 * Validate token and link Telegram Chat ID to the User account
 */
export async function redeemLinkToken(
  token: string,
  telegramChatId: bigint,
  telegramUsername?: string | null
): Promise<{
  success: boolean;
  message: string;
  user?: any;
}> {
  const pendingToken = tokenStore.get(token);

  if (!pendingToken) {
    return { success: false, message: 'Token tautan tidak valid atau tidak ditemukan.' };
  }

  if (pendingToken.expiresAt < Date.now()) {
    tokenStore.delete(token);
    return { success: false, message: 'Token tautan sudah kedaluwarsa (berlaku 5 menit). Silakan minta tautan baru dari Web.' };
  }

  const userId = pendingToken.userId;

  try {
    // Upsert TelegramLink for the user in PostgreSQL
    const telegramLink = await prisma.telegramLink.upsert({
      where: { userId },
      create: {
        userId,
        telegramChatId,
        telegramUsername: telegramUsername || null,
        isActive: true,
      },
      update: {
        telegramChatId,
        telegramUsername: telegramUsername || null,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    // Delete token after successful single use
    tokenStore.delete(token);

    return {
      success: true,
      message: `Akun Telegram berhasil terhubung ke ${telegramLink.user.name}!`,
      user: telegramLink.user,
    };
  } catch (error: any) {
    console.error('Error linking Telegram account:', error);
    return { success: false, message: 'Gagal memperbarui database saat menghubungkan akun.' };
  }
}
