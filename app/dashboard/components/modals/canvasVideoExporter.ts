/**
 * Client-Side Canvas Video Exporter for LifeOS Share Cards
 * Renders a butter-smooth 60fps Google Maps Dark Mode animated video story directly in browser
 */

import { ShareCardData } from './ShareCardModal';

const THEMES: Record<string, {
  name: string;
  bg1: string; bg2: string; bg3: string;
  primary: string; secondary: string; glow: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  cardBg: string; cardBorder: string; badgeBg: string; badgeText: string;
  mapRoadMain: string; mapRoadSub: string; mapWater: string; mapPark: string;
}> = {
  strava: {
    name: 'Google Maps Night (Strava Orange)',
    bg1: '#12141c', bg2: '#181c28', bg3: '#0c0e14',
    primary: '#FC4C02', secondary: '#FF9100', glow: '#FF3D00',
    textPrimary: '#FFFFFF', textSecondary: '#FFCCBC', textMuted: '#9E9E9E',
    cardBg: 'rgba(24, 28, 40, 0.85)', cardBorder: 'rgba(252, 76, 2, 0.35)',
    badgeBg: 'rgba(252, 76, 2, 0.25)', badgeText: '#FF7A45',
    mapRoadMain: '#383e52', mapRoadSub: '#232838', mapWater: '#0f1c2e', mapPark: '#152b1e',
  },
  cyber: {
    name: 'Google Maps Dark (Cyber Mint)',
    bg1: '#0d1619', bg2: '#132227', bg3: '#080e10',
    primary: '#00E676', secondary: '#00B0FF', glow: '#00E676',
    textPrimary: '#FFFFFF', textSecondary: '#B9F6CA', textMuted: '#80CBC4',
    cardBg: 'rgba(19, 34, 39, 0.85)', cardBorder: 'rgba(0, 230, 118, 0.35)',
    badgeBg: 'rgba(0, 230, 118, 0.25)', badgeText: '#69F0AE',
    mapRoadMain: '#243b42', mapRoadSub: '#192b30', mapWater: '#091c24', mapPark: '#123023',
  },
  purple: {
    name: 'Google Maps Night (Neon Violet)',
    bg1: '#130d1d', bg2: '#1e142e', bg3: '#0b0712',
    primary: '#C084FC', secondary: '#F472B6', glow: '#A855F7',
    textPrimary: '#FFFFFF', textSecondary: '#E9D5FF', textMuted: '#B39DDB',
    cardBg: 'rgba(30, 20, 46, 0.85)', cardBorder: 'rgba(168, 85, 247, 0.35)',
    badgeBg: 'rgba(168, 85, 247, 0.25)', badgeText: '#D8B4FE',
    mapRoadMain: '#362752', mapRoadSub: '#241a38', mapWater: '#160e29', mapPark: '#1b2620',
  },
  ocean: {
    name: 'Google Maps Satellite (Sapphire)',
    bg1: '#0a1526', bg2: '#10223b', bg3: '#060d17',
    primary: '#38BDF8', secondary: '#34D399', glow: '#0EA5E9',
    textPrimary: '#FFFFFF', textSecondary: '#BAE6FD', textMuted: '#90CAF9',
    cardBg: 'rgba(16, 34, 59, 0.85)', cardBorder: 'rgba(14, 165, 233, 0.35)',
    badgeBg: 'rgba(14, 165, 233, 0.25)', badgeText: '#7DD3FC',
    mapRoadMain: '#244066', mapRoadSub: '#162b47', mapWater: '#0b1d36', mapPark: '#122c26',
  },
  dark: {
    name: 'Google Maps Minimal (Obsidian)',
    bg1: '#111113', bg2: '#1a1a1e', bg3: '#0a0a0b',
    primary: '#A3E635', secondary: '#38BDF8', glow: '#84CC16',
    textPrimary: '#FFFFFF', textSecondary: '#D9F99D', textMuted: '#A1A1AA',
    cardBg: 'rgba(26, 26, 30, 0.85)', cardBorder: 'rgba(255, 255, 255, 0.2)',
    badgeBg: 'rgba(163, 230, 53, 0.25)', badgeText: '#BEF264',
    mapRoadMain: '#33333b', mapRoadSub: '#222228', mapWater: '#121721', mapPark: '#19241b',
  },
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

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

      // Safe cross-browser MIME type check
      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      }

      const stream = canvas.captureStream(60);
      let mediaRecorder: MediaRecorder;

      try {
        const options: MediaRecorderOptions = { videoBitsPerSecond: 8000000 };
        if (mimeType) options.mimeType = mimeType;
        mediaRecorder = new MediaRecorder(stream, options);
      } catch {
        const options: MediaRecorderOptions = {};
        if (mimeType) options.mimeType = mimeType;
        mediaRecorder = new MediaRecorder(stream, options);
      }

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

      const durationMs = 5000;
      const targetFps = 60;
      const totalFrames = Math.floor((durationMs / 1000) * targetFps);
      let currentFrame = 0;

      const habitList: string[] = cardData.completedHabitNames && cardData.completedHabitNames.length > 0
        ? cardData.completedHabitNames
        : ['Workout', 'Meditation', 'Reading', 'Hydration'];

      const taskList: string[] = cardData.completedTaskTitles && cardData.completedTaskTitles.length > 0
        ? cardData.completedTaskTitles
        : ['Productivity Sprint', 'Code Review'];

      const routePoints: Array<[number, number]> = [
        [220, format === 'story' ? 420 : 280],
        [380, format === 'story' ? 260 : 180],
        [580, format === 'story' ? 380 : 240],
        [880, format === 'story' ? 320 : 170],
        [920, format === 'story' ? 580 : 340],
        [680, format === 'story' ? 820 : 550],
        [380, format === 'story' ? 720 : 480],
        [240, format === 'story' ? 1020 : 700],
        [680, format === 'story' ? 1280 : 860],
        [880, format === 'story' ? 1480 : 760],
        [520, format === 'story' ? 1720 : 920],
      ];

      const intervalMs = 1000 / targetFps;
      const renderInterval = setInterval(() => {
        if (!ctx) return;
        const rawProgress = Math.min(1, currentFrame / totalFrames);
        const animProgress = Math.min(1, rawProgress / 0.50);
        const smoothProgress = easeOutCubic(animProgress);

        // 1. Base Dark Background
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, theme.bg1);
        grad.addColorStop(0.55, theme.bg2);
        grad.addColorStop(1, theme.bg3);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Google Maps Parks (Greenery Bodies)
        ctx.fillStyle = theme.mapPark;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(200, 300, 160, 120, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(850, 700, 180, 140, -0.3, 0, Math.PI * 2);
        ctx.fill();
        if (format === 'story') {
          ctx.beginPath();
          ctx.ellipse(300, 1400, 200, 150, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 3. Google Maps Water Body (River / Bay)
        ctx.fillStyle = theme.mapWater;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(-100, 850);
        ctx.bezierCurveTo(250, 800, 450, 1000, 750, 900);
        ctx.bezierCurveTo(1050, 1050, 1200, 1000, 1200, 1000);
        ctx.lineTo(1200, 1150);
        ctx.bezierCurveTo(1050, 1200, 700, 1050, 400, 1150);
        ctx.bezierCurveTo(-100, 1000, -100, 850, -100, 850);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // 4. Google Maps Secondary Streets Grid
        ctx.strokeStyle = theme.mapRoadSub;
        ctx.lineWidth = 5;
        ctx.globalAlpha = 0.6;
        for (let y = 250; y < height; y += 220) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
        for (let x = 180; x < width; x += 200) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // 5. Google Maps Highways & Yellow Arterial Line
        ctx.strokeStyle = theme.mapRoadMain;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(-50, 350);
        ctx.quadraticCurveTo(350, 200, 650, 480);
        ctx.quadraticCurveTo(850, 600, 1150, 750);
        ctx.stroke();

        ctx.strokeStyle = '#FFC107'; // Highway Yellow
        ctx.lineWidth = 4;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // 6. Strava Polyline Activity Route
        const routeProgress = easeOutCubic(Math.min(1, rawProgress / 0.45));
        if (routePoints.length > 1) {
          const pointCountToDraw = Math.floor(routeProgress * (routePoints.length - 1)) + 1;
          ctx.beginPath();
          ctx.moveTo(routePoints[0][0], routePoints[0][1]);
          for (let i = 1; i <= pointCountToDraw && i < routePoints.length; i++) {
            ctx.lineTo(routePoints[i][0], routePoints[i][1]);
          }
          ctx.strokeStyle = theme.primary;
          ctx.lineWidth = 10;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.globalAlpha = 0.4;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          // Start Pin
          ctx.fillStyle = theme.primary;
          ctx.beginPath();
          ctx.arc(routePoints[0][0], routePoints[0][1], 14, 0, Math.PI * 2);
          ctx.fill();

          // Head Node
          const headPoint = routePoints[Math.min(pointCountToDraw, routePoints.length - 1)];
          ctx.fillStyle = '#FF5252';
          ctx.beginPath();
          ctx.arc(headPoint[0], headPoint[1], 16, 0, Math.PI * 2);
          ctx.fill();
        }

        // 7. Header Google Maps Pill
        const pillAlpha = Math.min(1, rawProgress * 4);
        ctx.globalAlpha = pillAlpha;

        ctx.fillStyle = theme.badgeBg;
        ctx.strokeStyle = theme.cardBorder;
        ctx.lineWidth = 1.5;
        roundRect(ctx, 65, format === 'story' ? 90 : 75, 380, 50, 25, true, true);

        ctx.font = '800 18px Inter, sans-serif';
        ctx.fillStyle = theme.badgeText;
        ctx.fillText('📍 GOOGLE MAPS NIGHT MODE', 105, format === 'story' ? 122 : 107);

        // Date text
        ctx.font = '600 20px Inter, sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText(cardData.dateShort || cardData.date, width - 230, format === 'story' ? 122 : 107);

        // 8. User Header
        ctx.font = '900 50px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`${cardData.userName}'s Performance`, 65, format === 'story' ? 195 : 180);

        // 9. Hero Focus Score Box
        const focusTarget = cardData.focusScore || 0;
        const currentFocus = Math.floor(Math.min(focusTarget, smoothProgress * focusTarget));
        const heroBoxY = format === 'story' ? 240 : 200;
        const heroBoxHeight = format === 'story' ? 270 : 210;

        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        ctx.lineWidth = 2;
        roundRect(ctx, 65, heroBoxY, width - 130, heroBoxHeight, 30, true, true);

        ctx.font = '800 18px Inter, sans-serif';
        ctx.fillStyle = theme.textMuted;
        ctx.fillText('DAILY FOCUS SCORE', 100, heroBoxY + 50);

        ctx.font = '900 110px Inter, sans-serif';
        ctx.fillStyle = theme.primary;
        ctx.fillText(`${currentFocus}%`, 100, heroBoxY + 160);

        // Bar fill
        const barY = heroBoxY + heroBoxHeight - 40;
        const barWidth = width - 200;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        roundRect(ctx, 100, barY, barWidth, 14, 7, true, false);

        const currentBarWidth = (currentFocus / 100) * barWidth;
        if (currentBarWidth > 0) {
          const barGrad = ctx.createLinearGradient(100, barY, 100 + currentBarWidth, barY);
          barGrad.addColorStop(0, theme.primary);
          barGrad.addColorStop(1, theme.secondary);
          ctx.fillStyle = barGrad;
          roundRect(ctx, 100, barY, currentBarWidth, 14, 7, true, false);
        }

        // 10. Rich Finished Habits List Card
        const habitsY = heroBoxY + heroBoxHeight + 25;
        const habitsHeight = format === 'story' ? 210 : 200;
        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        roundRect(ctx, 65, habitsY, width - 130, habitsHeight, 26, true, true);

        ctx.font = '900 24px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`🎯 Habits Finished (${cardData.habitsCompleted}/${cardData.habitsTotal})`, 95, habitsY + 48);

        // Habit Pills
        let chipX = 95;
        let chipY = habitsY + 80;
        habitList.slice(0, format === 'story' ? 6 : 4).forEach((hName) => {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.strokeStyle = theme.cardBorder;
          const textWidth = ctx.measureText(`✓ ${hName}`).width + 30;
          if (chipX + textWidth > width - 100) {
            chipX = 95;
            chipY += 48;
          }
          roundRect(ctx, chipX, chipY, textWidth, 38, 12, true, true);

          ctx.font = '700 16px Inter, sans-serif';
          ctx.fillStyle = theme.primary;
          ctx.fillText('✓', chipX + 12, chipY + 25);
          ctx.fillStyle = theme.textSecondary;
          ctx.fillText(hName, chipX + 28, chipY + 25);
          chipX += textWidth + 12;
        });

        // 11. Rich Finished Tasks List Card
        const tasksY = habitsY + habitsHeight + 25;
        const tasksHeight = format === 'story' ? 200 : 180;
        ctx.fillStyle = theme.cardBg;
        ctx.strokeStyle = theme.cardBorder;
        roundRect(ctx, 65, tasksY, width - 130, tasksHeight, 26, true, true);

        ctx.font = '900 24px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText(`✅ Tasks Accomplished (${cardData.tasksCompleted}/${cardData.tasksTotal})`, 95, tasksY + 48);

        // Task Pills
        let tChipX = 95;
        let tChipY = tasksY + 80;
        taskList.slice(0, format === 'story' ? 4 : 3).forEach((tTitle) => {
          ctx.fillStyle = 'rgba(255,255,255,0.06)';
          ctx.strokeStyle = theme.cardBorder;
          const textWidth = ctx.measureText(`✓ ${tTitle}`).width + 30;
          if (tChipX + textWidth > width - 100) {
            tChipX = 95;
            tChipY += 46;
          }
          roundRect(ctx, tChipX, tChipY, textWidth, 38, 12, true, true);

          ctx.font = '700 16px Inter, sans-serif';
          ctx.fillStyle = theme.secondary;
          ctx.fillText('✓', tChipX + 12, tChipY + 25);
          ctx.fillStyle = theme.textSecondary;
          ctx.fillText(tTitle, tChipX + 28, tChipY + 25);
          tChipX += textWidth + 12;
        });

        // Additional Cards for Story format (1080x1920)
        if (format === 'story') {
          // 12. Streak Banner
          const streakY = tasksY + tasksHeight + 25;
          ctx.fillStyle = theme.cardBg;
          ctx.strokeStyle = theme.cardBorder;
          roundRect(ctx, 65, streakY, width - 130, 120, 24, true, true);

          ctx.font = '36px sans-serif';
          ctx.fillText('🔥', 95, streakY + 72);

          ctx.font = '900 28px Inter, sans-serif';
          ctx.fillStyle = theme.textPrimary;
          ctx.fillText(cardData.topStreak ? cardData.topStreak.name : 'Daily Streak', 150, streakY + 55);

          ctx.font = '600 18px Inter, sans-serif';
          ctx.fillStyle = theme.textSecondary;
          ctx.fillText('Active Habit Streak', 150, streakY + 85);

          ctx.font = '900 36px Inter, sans-serif';
          ctx.fillStyle = theme.primary;
          ctx.fillText(`${cardData.topStreak ? cardData.topStreak.streak : 14} DAYS`, width - 280, streakY + 72);

          // 13. Achievements Badges Grid
          const achY = streakY + 145;
          ctx.font = '900 22px Inter, sans-serif';
          ctx.fillStyle = theme.textPrimary;
          ctx.fillText('🏆 Unlocked Achievements', 65, achY + 25);

          let achX = 65;
          let achRowY = achY + 45;
          const badges = cardData.achievements && cardData.achievements.length > 0
            ? cardData.achievements
            : ['🎯 Perfect Habits', '🔥 14-Day Warrior', '⭐ Focus Master'];

          badges.slice(0, 4).forEach((badge) => {
            const bWidth = ctx.measureText(badge).width + 36;
            ctx.fillStyle = theme.badgeBg;
            ctx.strokeStyle = theme.cardBorder;
            roundRect(ctx, achX, achRowY, bWidth, 44, 14, true, true);

            ctx.font = '800 18px Inter, sans-serif';
            ctx.fillStyle = theme.badgeText;
            ctx.fillText(badge, achX + 18, achRowY + 28);
            achX += bWidth + 12;
          });

          // 14. Journal Reflection Box
          const journalY = achY + 115;
          ctx.fillStyle = theme.cardBg;
          ctx.strokeStyle = theme.cardBorder;
          roundRect(ctx, 65, journalY, width - 130, 160, 26, true, true);

          ctx.font = '800 16px Inter, sans-serif';
          ctx.fillStyle = theme.textMuted;
          ctx.fillText('📖 DAILY JOURNAL REFLECTION', 95, journalY + 45);

          ctx.font = 'italic 500 22px Inter, sans-serif';
          ctx.fillStyle = theme.textPrimary;
          const snippetText = cardData.journalSnippet
            ? `"${cardData.journalSnippet}"`
            : `"${cardData.quote}"`;
          ctx.fillText(snippetText, 95, journalY + 95);
        }

        // 15. Watermark Pill Footer
        const watermarkY = height - 100;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        roundRect(ctx, (width - 340) / 2, watermarkY, 340, 50, 25, true, true);

        ctx.font = '800 20px Inter, sans-serif';
        ctx.fillStyle = theme.textPrimary;
        ctx.fillText('⚡ LIFE OS • lifeos.app', (width - 340) / 2 + 38, watermarkY + 32);

        ctx.globalAlpha = 1.0;

        currentFrame++;
        if (onProgress) {
          onProgress(Math.min(100, Math.floor((currentFrame / totalFrames) * 100)));
        }

        if (currentFrame > totalFrames) {
          clearInterval(renderInterval);
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 400);
        }
      }, intervalMs);
    } catch (err) {
      console.error('Error generating animated video:', err);
      reject(err);
    }
  });
}

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
