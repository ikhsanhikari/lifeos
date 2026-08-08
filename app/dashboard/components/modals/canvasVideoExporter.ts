/**
 * Client-Side Canvas Video Exporter for LifeOS Share Cards
 * Renders a 60fps Strava-style animated video story directly in browser
 */

import { ShareCardData } from './ShareCardModal';

const THEMES: Record<string, {
  bg1: string; bg2: string; bg3: string;
  primary: string; secondary: string; glow: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  cardBg: string; cardBorder: string; badgeBg: string; badgeText: string;
}> = {
  strava: {
    bg1: '#0d0705', bg2: '#1f0d07', bg3: '#080504',
    primary: '#FC4C02', secondary: '#FF8800', glow: '#FF3D00',
    textPrimary: '#FFFFFF', textSecondary: '#FFCCBC', textMuted: '#8C6658',
    cardBg: 'rgba(252, 76, 2, 0.12)', cardBorder: 'rgba(252, 76, 2, 0.3)',
    badgeBg: 'rgba(252, 76, 2, 0.25)', badgeText: '#FF7A45',
  },
  cyber: {
    bg1: '#03140e', bg2: '#082b1d', bg3: '#020d09',
    primary: '#00E676', secondary: '#00B0FF', glow: '#00E676',
    textPrimary: '#FFFFFF', textSecondary: '#B9F6CA', textMuted: '#4E8A6E',
    cardBg: 'rgba(0, 230, 118, 0.12)', cardBorder: 'rgba(0, 230, 118, 0.3)',
    badgeBg: 'rgba(0, 230, 118, 0.25)', badgeText: '#69F0AE',
  },
  purple: {
    bg1: '#0f051d', bg2: '#1f0a3b', bg3: '#090312',
    primary: '#C084FC', secondary: '#F472B6', glow: '#A855F7',
    textPrimary: '#FFFFFF', textSecondary: '#E9D5FF', textMuted: '#7E5B9B',
    cardBg: 'rgba(168, 85, 247, 0.12)', cardBorder: 'rgba(168, 85, 247, 0.3)',
    badgeBg: 'rgba(168, 85, 247, 0.25)', badgeText: '#D8B4FE',
  },
  ocean: {
    bg1: '#04101e', bg2: '#08213d', bg3: '#020a14',
    primary: '#38BDF8', secondary: '#34D399', glow: '#0EA5E9',
    textPrimary: '#FFFFFF', textSecondary: '#BAE6FD', textMuted: '#4B7A94',
    cardBg: 'rgba(14, 165, 233, 0.12)', cardBorder: 'rgba(14, 165, 233, 0.3)',
    badgeBg: 'rgba(14, 165, 233, 0.25)', badgeText: '#7DD3FC',
  },
  dark: {
    bg1: '#09090b', bg2: '#18181b', bg3: '#000000',
    primary: '#A3E635', secondary: '#38BDF8', glow: '#84CC16',
    textPrimary: '#FFFFFF', textSecondary: '#D9F99D', textMuted: '#71717A',
    cardBg: 'rgba(255, 255, 255, 0.08)', cardBorder: 'rgba(255, 255, 255, 0.2)',
    badgeBg: 'rgba(163, 230, 53, 0.25)', badgeText: '#BEF264',
  },
};

export async function generateAnimatedShareVideo(
  cardData: ShareCardData,
  themeKey: string = 'strava',
  format: 'square' | 'story' = 'story',
  onProgress?: (percent: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const theme = THEMES[themeKey] || THEMES.strava;
      const width = 1080;
      const height = format === 'story' ? 1920 : 1080;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // Check supported MIME type
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else {
          mimeType = '';
        }
      }

      const stream = canvas.captureStream(60);
      const recorderOptions: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType || 'video/webm' });
        resolve(finalBlob);
      };

      mediaRecorder.start();

      const durationMs = 3500; // 3.5 seconds total video duration
      const fps = 60;
      const totalFrames = Math.floor((durationMs / 1000) * fps);
      let currentFrame = 0;

      // Sample Strava Polyline Points
      const routePoints: Array<[number, number]> = [
        [180, format === 'story' ? 400 : 280],
        [280, format === 'story' ? 260 : 180],
        [480, format === 'story' ? 340 : 240],
        [780, format === 'story' ? 240 : 170],
        [920, format === 'story' ? 480 : 340],
        [680, format === 'story' ? 720 : 550],
        [420, format === 'story' ? 620 : 480],
        [240, format === 'story' ? 850 : 700],
        [650, format === 'story' ? 1100 : 860],
        [880, format === 'story' ? 1350 : 760],
        [520, format === 'story' ? 1650 : 920],
      ];

      function drawFrame() {
        if (!ctx) return;
        const progress = Math.min(1, currentFrame / totalFrames);

        // 1. Background Gradient
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, theme.bg1);
        grad.addColorStop(0.55, theme.bg2);
        grad.addColorStop(1, theme.bg3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Radial Glow Orbs
        const glow1 = ctx.createRadialGradient(width * 0.8, height * 0.1, 0, width * 0.8, height * 0.1, 450);
        glow1.addColorStop(0, theme.glow + '40');
        glow1.addColorStop(1, 'transparent');
        ctx.fillStyle = glow1;
        ctx.fillRect(0, 0, width, height);

        const glow2 = ctx.createRadialGradient(width * 0.2, height * 0.85, 0, width * 0.2, height * 0.85, 400);
        glow2.addColorStop(0, theme.secondary + '30');
        glow2.addColorStop(1, 'transparent');
        ctx.fillStyle = glow2;
        ctx.fillRect(0, 0, width, height);

        // 3. Grid Lines Background
        ctx.strokeStyle = theme.primary;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        for (let y = 200; y < height; y += 300) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        for (let x = 200; x < width; x += 300) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.globalAlpha = 1.0;

        // 4. Animated Strava Polyline Activity Route
        const routeProgress = Math.min(1, progress * 1.4); // finishes route drawing early
        if (routePoints.length > 1) {
          const pointCountToDraw = Math.floor(routeProgress * (routePoints.length - 1)) + 1;
          ctx.beginPath();
          ctx.moveTo(routePoints[0][0], routePoints[0][1]);
          for (let i = 1; i <= pointCountToDraw && i < routePoints.length; i++) {
            ctx.lineTo(routePoints[i][0], routePoints[i][1]);
          }
          ctx.strokeStyle = theme.primary;
          ctx.lineWidth = 8;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.35;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Start Node
          ctx.fillStyle = theme.primary;
          ctx.beginPath();
          ctx.arc(routePoints[0][0], routePoints[0][1], 12, 0, Math.PI * 2);
          ctx.fill();

          // Current Route Head Node
          const headPoint = routePoints[Math.min(pointCountToDraw, routePoints.length - 1)];
          ctx.fillStyle = theme.secondary;
          ctx.beginPath();
          ctx.arc(headPoint[0], headPoint[1], 14, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5. Header Brand Pill
        const pillAlpha = Math.min(1, progress * 3);
        ctx.globalAlpha = pillAlpha;
        ctx.fillStyle = theme.badgeBg;
        ctx.strokeStyle = theme.cardBorder;
        ctx.lineWidth = 1.5;

        // Header pill background
        roundRect(ctx, 70, 80, 360, 50, 25, true, true);
        ctx.fillStyle = theme.primary;
        ctx.beginPath();
        ctx.arc(95, 105, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '800 18px Inter, sans-serif';
        ctx.fillStyle = theme.badgeText;
        ctx.fillText('LIFE OS ANIMATED STORY', 115, 112);

        // Date text
        ctx.font = '600 20px Inter, sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(cardData.dateShort || cardData.date, width - 240, 112);

        // 6. User Name Header
        ctx.font = '900 52px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`${cardData.userName}'s Daily Flex`, 70, 190);

        // 7. Hero Focus Score Box (Animated Counter)
        const focusTarget = cardData.focusScore || 0;
        const currentFocus = Math.floor(Math.min(focusTarget, progress * 1.3 * focusTarget));

        const heroBoxY = format === 'story' ? 240 : 210;
        const heroBoxHeight = format === 'story' ? 320 : 240;

        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        ctx.lineWidth = 2;
        roundRect(ctx, 70, heroBoxY, width - 140, heroBoxHeight, 32, true, true);

        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText('DAILY FOCUS SCORE', 110, heroBoxY + 55);

        ctx.font = '900 120px Inter, sans-serif';
        ctx.fillStyle = theme.primary;
        ctx.fillText(`${currentFocus}%`, 110, heroBoxY + 185);

        // Focus Score Progress Bar
        const barY = heroBoxY + heroBoxHeight - 45;
        const barWidth = width - 220;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, 110, barY, barWidth, 16, 8, true, false);

        const currentBarWidth = (currentFocus / 100) * barWidth;
        if (currentBarWidth > 0) {
          const barGrad = ctx.createLinearGradient(110, barY, 110 + currentBarWidth, barY);
          barGrad.addColorStop(0, theme.primary);
          barGrad.addColorStop(1, theme.secondary);
          ctx.fillStyle = barGrad;
          roundRect(ctx, 110, barY, currentBarWidth, 16, 8, true, false);
        }

        // 8. Dual Stat Cards (Habits & Tasks)
        const statY = heroBoxY + heroBoxHeight + 30;
        const statWidth = (width - 165) / 2;

        // Habits Card
        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        roundRect(ctx, 70, statY, statWidth, 190, 28, true, true);

        ctx.font = '32px sans-serif';
        ctx.fillText('🎯', 100, statY + 55);

        const habitsDone = cardData.habitsCompleted || 0;
        const habitsTotal = cardData.habitsTotal || 0;
        const animHabitsDone = Math.floor(Math.min(habitsDone, progress * 1.5 * habitsDone));

        ctx.font = '900 52px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`${animHabitsDone}/${habitsTotal}`, 100, statY + 125);

        ctx.font = '700 20px Inter, sans-serif';
        ctx.fillStyle = theme.textSecondary;
        ctx.fillText('Habits Finished', 100, statY + 162);

        // Tasks Card
        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        roundRect(ctx, 70 + statWidth + 25, statY, statWidth, 190, 28, true, true);

        ctx.font = '32px sans-serif';
        ctx.fillText('✅', 70 + statWidth + 55, statY + 55);

        const tasksDone = cardData.tasksCompleted || 0;
        const tasksTotal = cardData.tasksTotal || 0;
        const animTasksDone = Math.floor(Math.min(tasksDone, progress * 1.5 * tasksDone));

        ctx.font = '900 52px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`${animTasksDone}/${tasksTotal}`, 70 + statWidth + 55, statY + 125);

        ctx.font = '700 20px Inter, sans-serif';
        ctx.fillStyle = theme.textSecondary;
        ctx.fillText('Tasks Finished', 70 + statWidth + 55, statY + 162);

        // 9. Streak Flex Card (if topStreak exists)
        if (cardData.topStreak && format === 'story') {
          const streakY = statY + 220;
          ctx.fillStyle = theme.cardBg;
          ctx.strokeStyle = theme.cardBorder;
          roundRect(ctx, 70, streakY, width - 140, 110, 24, true, true);

          ctx.font = '36px sans-serif';
          ctx.fillText('🔥', 105, streakY + 68);

          ctx.font = '900 26px Inter, sans-serif';
          ctx.fillStyle = theme.textPrimary;
          ctx.fillText(cardData.topStreak.name, 160, streakY + 52);

          ctx.font = '600 18px Inter, sans-serif';
          ctx.fillStyle = theme.textSecondary;
          ctx.fillText('Active Habit Streak', 160, streakY + 80);

          ctx.font = '900 36px Inter, sans-serif';
          ctx.fillStyle = theme.primary;
          ctx.fillText(`${cardData.topStreak.streak} DAYS`, width - 260, streakY + 68);
        }

        // 10. Watermark Pill Footer
        const watermarkY = height - 100;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        roundRect(ctx, (width - 340) / 2, watermarkY, 340, 52, 26, true, true);

        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText('⚡ LIFE OS • lifeos.app', (width - 340) / 2 + 38, watermarkY + 33);

        ctx.globalAlpha = 1.0;

        currentFrame++;
        if (onProgress) {
          onProgress(Math.min(100, Math.floor((currentFrame / totalFrames) * 100)));
        }

        if (currentFrame <= totalFrames) {
          requestAnimationFrame(drawFrame);
        } else {
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 300);
        }
      }

      drawFrame();
    } catch (err) {
      console.error('Error generating animated video:', err);
      reject(err);
    }
  });
}

// Canvas helper function for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean,
  stroke: boolean
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  }
  if (stroke) {
    ctx.stroke();
  }
}
