import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getAiStatus, generateGoalBreakdown, generateDailyCoachInsight, generateWeeklySummary } from '../services/aiService';
import { prisma } from '../server';

/**
 * GET /api/ai/status
 * Check overall AI availability and user-specific quota/settings
 */
export async function handleAiStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    const status = await getAiStatus(userId);
    res.json(status);
  } catch (error: any) {
    console.error('Error in handleAiStatus controller:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/ai/goal-breakdown
 * Generate actionable subtasks for a goal using AI
 */
export async function handleAiGoalBreakdown(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Silakan login.' });
      return;
    }

    const { goalId, goalTitle, goalDescription } = req.body;

    let title = goalTitle;
    let description = goalDescription;

    // If goalId is provided but goalTitle isn't, fetch goal from database
    if (goalId && (!title || title.trim() === '')) {
      const existingGoal = await prisma.goal.findUnique({
        where: { id: goalId },
      });
      if (!existingGoal) {
        res.status(404).json({ success: false, message: 'Goal tidak ditemukan.' });
        return;
      }
      title = existingGoal.title;
      description = existingGoal.description || undefined;
    }

    if (!title || title.trim() === '') {
      res.status(400).json({ success: false, message: 'Judul goal (goalTitle) wajib diisi.' });
      return;
    }

    const result = await generateGoalBreakdown(req.user.id, title.trim(), description);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in handleAiGoalBreakdown controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error saat membuat AI breakdown.' });
  }
}

/**
 * POST /api/ai/daily-coach
 * Generate AI Coach insight & suggestions for today's journal and mood
 */
export async function handleAiDailyCoach(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Silakan login.' });
      return;
    }

    const { journal, mood, energy } = req.body;
    const result = await generateDailyCoachInsight(
      req.user.id,
      journal,
      mood !== undefined ? parseInt(mood, 10) : undefined,
      energy !== undefined ? parseInt(energy, 10) : undefined
    );

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in handleAiDailyCoach controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error saat memproses AI Daily Coach.' });
  }
}

/**
 * GET /api/ai/weekly-summary
 * Generate weekly smart summary report
 */
export async function handleAiWeeklySummary(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Silakan login.' });
      return;
    }

    const result = await generateWeeklySummary(req.user.id);

    if (!result.success) {
      res.status(400).json(result);
      return;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error in handleAiWeeklySummary controller:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error saat memproses AI Weekly Summary.' });
  }
}

