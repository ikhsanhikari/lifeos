import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getOrCreateUserSettings } from '../services/aiService';
import { prisma } from '../server';

/**
 * GET /api/settings
 * Fetch user's settings (both AI and Reminder preferences)
 */
export async function handleGetUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const settings = await getOrCreateUserSettings(req.user.id);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * PUT /api/settings
 * Update user's settings (AI & Telegram reminder preferences)
 */
export async function handleUpdateUserSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      remindersEnabled,
      morningReminderTime,
      eveningRecapTime,
      streakAlertTime,
      hourlyRemindersEnabled,
      aiEnabled,
      aiGoalBreakdown,
      aiDailyCoach,
      aiSmartSummary,
    } = req.body;

    // Ensure user settings record exists
    await getOrCreateUserSettings(req.user.id);

    const updated = await prisma.userSettings.update({
      where: { userId: req.user.id },
      data: {
        ...(typeof remindersEnabled === 'boolean' && { remindersEnabled }),
        ...(typeof morningReminderTime === 'string' && { morningReminderTime }),
        ...(typeof eveningRecapTime === 'string' && { eveningRecapTime }),
        ...(typeof streakAlertTime === 'string' && { streakAlertTime }),
        ...(typeof hourlyRemindersEnabled === 'boolean' && { hourlyRemindersEnabled }),
        ...(typeof aiEnabled === 'boolean' && { aiEnabled }),
        ...(typeof aiGoalBreakdown === 'boolean' && { aiGoalBreakdown }),
        ...(typeof aiDailyCoach === 'boolean' && { aiDailyCoach }),
        ...(typeof aiSmartSummary === 'boolean' && { aiSmartSummary }),
      },
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
