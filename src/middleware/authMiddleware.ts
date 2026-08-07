import { Request, Response, NextFunction } from 'express';
import { verifyJwtSessionToken } from '../services/authService';
import { prisma } from '../server';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    telegramChatId?: string;
  };
}

/**
 * Extract authenticated user from Authorization Bearer token or chatId query param.
 * Does NOT set fallback default user when unauthenticated.
 */
export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyJwtSessionToken(token);

      if (decoded) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          telegramChatId: decoded.telegramChatId,
        };
        return next();
      }
    }

    // Check query parameter chatId (for Telegram Bot internal API calls)
    if (req.query.chatId) {
      try {
        const chatId = BigInt(req.query.chatId as string);
        const link = await prisma.telegramLink.findUnique({
          where: { telegramChatId: chatId },
          include: { user: true },
        });

        if (link && link.user) {
          req.user = {
            id: link.user.id,
            email: link.user.email,
            name: link.user.name,
            telegramChatId: chatId.toString(),
          };
          return next();
        }
      } catch (e) {
        // invalid bigint
      }
    }

    // Check query parameter userId
    if (req.query.userId) {
      const user = await prisma.user.findUnique({
        where: { id: req.query.userId as string },
      });
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name };
        return next();
      }
    }

    // Unauthenticated: leave req.user undefined
    req.user = undefined;
    next();
  } catch (error) {
    console.error('Error in authMiddleware:', error);
    req.user = undefined;
    next();
  }
}

/**
 * Strict middleware: Returns 401 Unauthorized if no user session is present
 */
export async function requireAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  await authMiddleware(req, res, () => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please login via Telegram.' });
      return;
    }
    next();
  });
}
