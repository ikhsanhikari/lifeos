import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Google Maps Night & Dark Theme Palettes
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
    cardBg: 'rgba(24, 28, 40, 0.75)', cardBorder: 'rgba(252, 76, 2, 0.35)',
    badgeBg: 'rgba(252, 76, 2, 0.25)', badgeText: '#FF7A45',
    mapRoadMain: '#383e52', mapRoadSub: '#232838', mapWater: '#0f1c2e', mapPark: '#152b1e',
  },
  cyber: {
    name: 'Google Maps Dark (Cyber Mint)',
    bg1: '#0d1619', bg2: '#132227', bg3: '#080e10',
    primary: '#00E676', secondary: '#00B0FF', glow: '#00E676',
    textPrimary: '#FFFFFF', textSecondary: '#B9F6CA', textMuted: '#80CBC4',
    cardBg: 'rgba(19, 34, 39, 0.75)', cardBorder: 'rgba(0, 230, 118, 0.35)',
    badgeBg: 'rgba(0, 230, 118, 0.25)', badgeText: '#69F0AE',
    mapRoadMain: '#243b42', mapRoadSub: '#192b30', mapWater: '#091c24', mapPark: '#123023',
  },
  purple: {
    name: 'Google Maps Night (Neon Violet)',
    bg1: '#130d1d', bg2: '#1e142e', bg3: '#0b0712',
    primary: '#C084FC', secondary: '#F472B6', glow: '#A855F7',
    textPrimary: '#FFFFFF', textSecondary: '#E9D5FF', textMuted: '#B39DDB',
    cardBg: 'rgba(30, 20, 46, 0.75)', cardBorder: 'rgba(168, 85, 247, 0.35)',
    badgeBg: 'rgba(168, 85, 247, 0.25)', badgeText: '#D8B4FE',
    mapRoadMain: '#362752', mapRoadSub: '#241a38', mapWater: '#160e29', mapPark: '#1b2620',
  },
  ocean: {
    name: 'Google Maps Satellite (Sapphire)',
    bg1: '#0a1526', bg2: '#10223b', bg3: '#060d17',
    primary: '#38BDF8', secondary: '#34D399', glow: '#0EA5E9',
    textPrimary: '#FFFFFF', textSecondary: '#BAE6FD', textMuted: '#90CAF9',
    cardBg: 'rgba(16, 34, 59, 0.75)', cardBorder: 'rgba(14, 165, 233, 0.35)',
    badgeBg: 'rgba(14, 165, 233, 0.25)', badgeText: '#7DD3FC',
    mapRoadMain: '#244066', mapRoadSub: '#162b47', mapWater: '#0b1d36', mapPark: '#122c26',
  },
  dark: {
    name: 'Google Maps Minimal (Obsidian)',
    bg1: '#111113', bg2: '#1a1a1e', bg3: '#0a0a0b',
    primary: '#A3E635', secondary: '#38BDF8', glow: '#84CC16',
    textPrimary: '#FFFFFF', textSecondary: '#D9F99D', textMuted: '#A1A1AA',
    cardBg: 'rgba(26, 26, 30, 0.75)', cardBorder: 'rgba(255, 255, 255, 0.2)',
    badgeBg: 'rgba(163, 230, 53, 0.25)', badgeText: '#BEF264',
    mapRoadMain: '#33333b', mapRoadSub: '#222228', mapWater: '#121721', mapPark: '#19241b',
  },
  sunset: {
    name: 'Sunset Crimson (Golden Hour)',
    bg1: '#1f0910', bg2: '#2a0e18', bg3: '#0f0407',
    primary: '#FF6B00', secondary: '#FF1493', glow: '#FF3B00',
    textPrimary: '#FFFFFF', textSecondary: '#FFD1B3', textMuted: '#D4889C',
    cardBg: 'rgba(42, 14, 24, 0.75)', cardBorder: 'rgba(255, 107, 0, 0.35)',
    badgeBg: 'rgba(255, 107, 0, 0.25)', badgeText: '#FF9E43',
    mapRoadMain: '#47222c', mapRoadSub: '#2e141c', mapWater: '#1c0812', mapPark: '#2d1810',
  },
  cyberpunk: {
    name: 'Cyberpunk Dual-Tone (Synthwave)',
    bg1: '#090514', bg2: '#120a24', bg3: '#040209',
    primary: '#00F0FF', secondary: '#FF007F', glow: '#00F0FF',
    textPrimary: '#FFFFFF', textSecondary: '#B5F6FF', textMuted: '#D175FF',
    cardBg: 'rgba(18, 10, 36, 0.75)', cardBorder: 'rgba(0, 240, 255, 0.35)',
    badgeBg: 'rgba(0, 240, 255, 0.25)', badgeText: '#5CE6FF',
    mapRoadMain: '#2c174d', mapRoadSub: '#1c0d33', mapWater: '#0d0621', mapPark: '#290b2e',
  },
};

function getMoodEmoji(mood: number | null): string {
  if (!mood) return '⚡ High Performance';
  if (mood >= 5) return '⚡ Super Charged';
  if (mood >= 4) return '🎯 High Focus';
  if (mood >= 3) return '⚡ Balanced Day';
  if (mood >= 2) return '🌧️ Recovering';
  return '💤 Resting';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'square';
    const slide = searchParams.get('slide') || '0';
    const themeKey = searchParams.get('theme') || 'strava';
    const dataParam = searchParams.get('data');

    let cardData: any = null;
    if (dataParam) {
      try {
        cardData = JSON.parse(decodeURIComponent(dataParam));
      } catch {
        return new Response('Invalid data parameter', { status: 400 });
      }
    }

    if (!cardData) {
      return new Response('Missing data parameter', { status: 400 });
    }

    const theme = THEMES[themeKey] || THEMES.strava;
    const width = 1080;
    const height = format === 'story' ? 1920 : 1080;
    const focusPercent = cardData.focusScore || 0;

    const habitList: string[] = cardData.completedHabitNames && cardData.completedHabitNames.length > 0
      ? cardData.completedHabitNames
      : ['Workout', 'Meditation', 'Reading', 'Hydration'];

    const taskList: string[] = cardData.completedTaskTitles && cardData.completedTaskTitles.length > 0
      ? cardData.completedTaskTitles
      : ['Productivity Sprint', 'Code Review'];

    // CAROUSEL SLIDES HANDLING (4 DISTINCT SLIDES)
    if (format === 'carousel') {
      if (slide === '1') {
        // SLIDE 2: HABITS & STREAKS BREAKDOWN
        return new ImageResponse(
          (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px', background: `linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`, fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}25, transparent 65%)`, display: 'flex' }} />
              
              {/* Slide Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '24px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '20px' }}>🔥</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>SLIDE 2/4 • HABITS & STREAKS</span>
                </div>
                <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 700 }}>{cardData.dateShort || cardData.date}</span>
              </div>

              {/* Giant Streak Banner */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', borderRadius: '32px', background: theme.cardBg, border: `2px solid ${theme.cardBorder}`, gap: '8px' }}>
                <span style={{ fontSize: '48px' }}>🔥</span>
                <span style={{ fontSize: '90px', fontWeight: 900, color: theme.primary, lineHeight: 0.95 }}>
                  {cardData.topStreak ? cardData.topStreak.streak : 14} DAYS
                </span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: theme.textPrimary, letterSpacing: '4px', textTransform: 'uppercase' }}>
                  {cardData.topStreak ? cardData.topStreak.name : 'DAILY HABIT STREAK'}
                </span>
              </div>

              {/* Habits List Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '28px', borderRadius: '26px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '14px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: theme.textPrimary }}>🎯 Completed Habits Today ({cardData.habitsCompleted}/{cardData.habitsTotal})</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {habitList.map((hName, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.cardBorder}`, fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>
                      <span style={{ color: theme.primary }}>✓</span> {hName}
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <span style={{ fontSize: '16px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
                </div>
              </div>
            </div>
          ),
          { width, height: 1080 }
        );
      } else if (slide === '2') {
        // SLIDE 3: TASKS & GOALS CHECKLIST
        return new ImageResponse(
          (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px', background: `linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`, fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.secondary}25, transparent 65%)`, display: 'flex' }} />

              {/* Slide Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '24px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '20px' }}>✅</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>SLIDE 3/4 • TASKS ACCOMPLISHED</span>
                </div>
                <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 700 }}>{cardData.dateShort || cardData.date}</span>
              </div>

              {/* Active Goals Badge & Task Counter */}
              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px', borderRadius: '26px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '6px' }}>
                  <span style={{ fontSize: '32px' }}>🚀</span>
                  <span style={{ fontSize: '56px', fontWeight: 900, color: theme.secondary, lineHeight: 1 }}>{cardData.tasksCompleted}/{cardData.tasksTotal}</span>
                  <span style={{ fontSize: '20px', color: theme.textSecondary, fontWeight: 700 }}>Tasks Finished</span>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '30px', borderRadius: '26px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '6px' }}>
                  <span style={{ fontSize: '32px' }}>🎯</span>
                  <span style={{ fontSize: '56px', fontWeight: 900, color: theme.primary, lineHeight: 1 }}>{cardData.activeGoalsCount || 3}</span>
                  <span style={{ fontSize: '20px', color: theme.textSecondary, fontWeight: 700 }}>Active Goals</span>
                </div>
              </div>

              {/* Finished Task List */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '28px', borderRadius: '26px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '14px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: theme.textPrimary }}>✅ Completed Tasks Checklist</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {taskList.map((title, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.cardBorder}`, fontSize: '20px', color: theme.textPrimary, fontWeight: 700 }}>
                      <span style={{ color: theme.secondary }}>✓</span> {title}
                    </div>
                  ))}
                </div>
              </div>

              {/* Watermark */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <span style={{ fontSize: '16px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
                </div>
              </div>
            </div>
          ),
          { width, height: 1080 }
        );
      } else if (slide === '3') {
        // SLIDE 4: REFLECTIONS & ACHIEVEMENTS
        return new ImageResponse(
          (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px', background: `linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`, fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}25, transparent 65%)`, display: 'flex' }} />

              {/* Slide Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '24px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '20px' }}>📖</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>SLIDE 4/4 • REFLECTIONS & BADGES</span>
                </div>
                <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 700 }}>{cardData.dateShort || cardData.date}</span>
              </div>

              {/* Journal Reflection Box */}
              {cardData.journalSnippet ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '32px', borderRadius: '28px', background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>📖 DAILY JOURNAL REFLECTION</span>
                  <span style={{ fontSize: '24px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 500 }}>&ldquo;{cardData.journalSnippet}&rdquo;</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '32px', borderRadius: '28px', background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>💡 MOTIVATION</span>
                  <span style={{ fontSize: '24px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 500 }}>&ldquo;{cardData.quote}&rdquo;</span>
                </div>
              )}

              {/* Achievements Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: theme.textPrimary }}>🏆 Unlocked Achievement Badges</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {cardData.achievements && cardData.achievements.length > 0 ? (
                    cardData.achievements.map((badge: string, i: number) => (
                      <div key={i} style={{ display: 'flex', padding: '14px 22px', borderRadius: '18px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '20px', color: theme.badgeText, fontWeight: 800 }}>
                        {badge}
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'flex', padding: '14px 22px', borderRadius: '18px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '20px', color: theme.badgeText, fontWeight: 800 }}>
                      🚀 Productive Day
                    </div>
                  )}
                </div>
              </div>

              {/* Watermark */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
                  <span style={{ fontSize: '16px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
                </div>
              </div>
            </div>
          ),
          { width, height: 1080 }
        );
      }
    }

    if (format === 'story') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '80px 65px',
              background: `linear-gradient(170deg, ${theme.bg1} 0%, ${theme.bg2} 55%, ${theme.bg3} 100%)`,
              fontFamily: 'Inter, system-ui, sans-serif',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* REALISTIC GOOGLE MAPS DARK MODE VECTOR BACKGROUND */}
            <svg
              width={width}
              height={height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0.35,
                pointerEvents: 'none',
              }}
              viewBox={`0 0 ${width} ${height}`}
              fill="none"
            >
              {/* Google Maps Parks / Greenery Bodies */}
              <path d="M 80 120 C 180 80, 320 220, 240 380 C 150 480, 50 350, 80 120 Z" fill={theme.mapPark} opacity="0.8" />
              <path d="M 720 540 C 880 480, 1020 620, 950 820 C 820 950, 680 850, 720 540 Z" fill={theme.mapPark} opacity="0.7" />
              <path d="M 120 1250 C 280 1150, 480 1350, 380 1550 C 220 1680, 50 1520, 120 1250 Z" fill={theme.mapPark} opacity="0.6" />

              {/* Google Maps River / Lake Water Body */}
              <path d="M -100 800 C 250 750, 450 950, 750 850 S 1100 1000, 1200 950 L 1200 1120 C 1050 1180, 700 1020, 400 1120 S -100 950, -100 800 Z" fill={theme.mapWater} opacity="0.85" />

              {/* Google Maps City Street Grid (Secondary Roads) */}
              <g stroke={theme.mapRoadSub} strokeWidth="6" opacity="0.7">
                <line x1="0" y1="250" x2="1080" y2="250" />
                <line x1="0" y1="450" x2="1080" y2="450" />
                <line x1="0" y1="680" x2="1080" y2="680" />
                <line x1="0" y1="920" x2="1080" y2="920" />
                <line x1="0" y1="1180" x2="1080" y2="1180" />
                <line x1="0" y1="1420" x2="1080" y2="1420" />
                <line x1="0" y1="1680" x2="1080" y2="1680" />

                <line x1="180" y1="0" x2="180" y2="1920" />
                <line x1="380" y1="0" x2="380" y2="1920" />
                <line x1="580" y1="0" x2="580" y2="1920" />
                <line x1="780" y1="0" x2="780" y2="1920" />
                <line x1="950" y1="0" x2="950" y2="1920" />
              </g>

              {/* Google Maps Major Highway Arterials */}
              <g stroke={theme.mapRoadMain} strokeWidth="16" strokeLinecap="round" opacity="0.9">
                <path d="M -50 350 Q 350 200 650 480 T 1150 750" />
                <path d="M 280 -50 Q 420 500 250 1100 T 820 1950" />
                <path d="M -50 1350 Q 550 1200 880 1550 T 1150 1750" />
              </g>

              {/* Glowing Highway Yellow Center Stripe */}
              <path d="M -50 350 Q 350 200 650 480 T 1150 750" stroke="#FFC107" strokeWidth="4" opacity="0.8" />

              {/* Strava GPS Activity Polyline Route */}
              <path
                d="M 220 420 Q 380 260 580 380 T 880 320 T 920 580 T 680 820 T 380 720 T 240 1020 T 680 1280 T 880 1480 T 520 1720"
                stroke={theme.primary}
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.95"
              />

              {/* Google Maps Pin & Ripple (Start & Destination) */}
              <circle cx="220" cy="420" r="16" fill={theme.primary} />
              <circle cx="220" cy="420" r="28" fill="none" stroke={theme.primary} strokeWidth="4" opacity="0.6" />

              <circle cx="520" cy="1720" r="16" fill="#FF5252" />
              <circle cx="520" cy="1720" r="32" fill="none" stroke="#FF5252" strokeWidth="4" opacity="0.7" />
            </svg>

            {/* Header: Google Maps Pill & Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 24px', borderRadius: '30px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '20px' }}>📍</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>GOOGLE MAPS NIGHT MODE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '20px', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <span style={{ fontSize: '16px', color: theme.textSecondary, fontWeight: 700 }}>JAKARTA • ID</span>
                </div>
              </div>

              {/* User Header */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                <span style={{ fontSize: '54px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                  {cardData.userName}&rsquo;s Performance
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px', color: theme.textSecondary, fontWeight: 600 }}>{getMoodEmoji(cardData.mood)}</span>
                  <span style={{ fontSize: '24px', color: theme.textMuted }}>•</span>
                  <span style={{ fontSize: '24px', color: theme.textSecondary, fontWeight: 600 }}>⚡ Energy: {cardData.energy || 4}/5</span>
                </div>
              </div>
            </div>

            {/* Hero Focus Score Card */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '45px',
                borderRadius: '34px',
                background: theme.cardBg,
                border: `1.5px solid ${theme.cardBorder}`,
                boxShadow: `0 30px 60px ${theme.glow}20`,
                position: 'relative',
                zIndex: 2,
                gap: '8px',
              }}
            >
              {/* Floating 3D Metallic Glass Orb Graphic */}
              <svg
                width="110"
                height="110"
                viewBox="0 0 110 110"
                style={{
                  position: 'absolute',
                  right: '40px',
                  top: '35px',
                  filter: `drop-shadow(0 14px 28px ${theme.glow}40)`,
                }}
              >
                <defs>
                  <radialGradient id={`orbGrad_${themeKey}`} cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="25%" stopColor={theme.primary} />
                    <stop offset="80%" stopColor={theme.secondary} />
                    <stop offset="100%" stopColor="#08080C" />
                  </radialGradient>
                </defs>
                <ellipse cx="55" cy="98" rx="42" ry="10" fill="rgba(0,0,0,0.4)" />
                <ellipse cx="55" cy="55" rx="52" ry="18" fill="none" stroke={theme.secondary} strokeWidth="4" opacity="0.6" transform="rotate(-15 55 55)" />
                <circle cx="55" cy="55" r="38" fill={`url(#orbGrad_${themeKey})`} />
                <path d="M 12 62 A 52 18 0 0 0 98 48" fill="none" stroke={theme.primary} strokeWidth="5" transform="rotate(-15 55 55)" />
              </svg>

              <span style={{ fontSize: '20px', fontWeight: 800, color: theme.textMuted, letterSpacing: '4px', textTransform: 'uppercase' }}>
                DAILY FOCUS SCORE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '120px', fontWeight: 900, color: theme.primary, lineHeight: 1, letterSpacing: '-4px' }}>
                  {focusPercent}
                </span>
                <span style={{ fontSize: '54px', fontWeight: 800, color: theme.primary }}>%</span>
              </div>

              {/* Progress bar */}
              <div style={{ display: 'flex', width: '100%', height: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '6px' }}>
                <div style={{ width: `${focusPercent}%`, height: '100%', borderRadius: '8px', background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />
              </div>
            </div>

            {/* Rich Habits & Tasks Finished Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
              {/* Habits Section with Completed Names List */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '30px 32px', borderRadius: '28px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>🎯</span>
                    <span style={{ fontSize: '26px', fontWeight: 900, color: theme.textPrimary }}>Habits Tracker</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: theme.primary }}>
                    {cardData.habitsCompleted}/{cardData.habitsTotal} Done
                  </span>
                </div>

                {/* List Chips of Finished Habits */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {habitList.slice(0, 6).map((name: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.cardBorder}`, fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>
                      <span style={{ color: theme.primary }}>✓</span> {name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tasks Section with Completed Task Titles List */}
              <div style={{ display: 'flex', flexDirection: 'column', padding: '30px 32px', borderRadius: '28px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>✅</span>
                    <span style={{ fontSize: '26px', fontWeight: 900, color: theme.textPrimary }}>Tasks Accomplished</span>
                  </div>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: theme.secondary }}>
                    {cardData.tasksCompleted}/{cardData.tasksTotal} Done
                  </span>
                </div>

                {/* List Chips of Finished Tasks */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {taskList.slice(0, 4).map((title: string, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '14px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${theme.cardBorder}`, fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>
                      <span style={{ color: theme.secondary }}>✓</span> {title}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Streak & Achievements Section */}
            <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 2 }}>
              {cardData.topStreak ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 28px', borderRadius: '24px', background: `linear-gradient(90deg, ${theme.primary}25, ${theme.secondary}15)`, border: `1px solid ${theme.primary}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>🔥</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: theme.textPrimary }}>{cardData.topStreak.name}</span>
                      <span style={{ fontSize: '16px', color: theme.textSecondary }}>Top Habit Streak</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '32px', fontWeight: 900, color: theme.primary }}>{cardData.topStreak.streak} DAYS</span>
                </div>
              ) : null}
            </div>

            {/* Achievements Badges */}
            {cardData.achievements && cardData.achievements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', position: 'relative', zIndex: 2 }}>
                {cardData.achievements.map((badge: string, i: number) => (
                  <div key={i} style={{ display: 'flex', padding: '12px 20px', borderRadius: '16px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '20px', color: theme.badgeText, fontWeight: 800 }}>
                    {badge}
                  </div>
                ))}
              </div>
            )}

            {/* Highlight / Reflection Quote */}
            {cardData.journalSnippet ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px 28px', borderRadius: '22px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>📖 DAILY JOURNAL REFLECTION</span>
                <span style={{ fontSize: '22px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 500 }}>&ldquo;{cardData.journalSnippet}&rdquo;</span>
              </div>
            ) : cardData.highlights && cardData.highlights.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '24px 28px', borderRadius: '22px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>✨ DAILY HIGHLIGHT</span>
                <span style={{ fontSize: '22px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{cardData.highlights[0]}&rdquo;</span>
              </div>
            ) : null}

            {/* Footer / Watermark */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 32px', borderRadius: '30px', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.18)' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <span style={{ fontSize: '22px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
                <span style={{ fontSize: '20px', color: theme.textMuted }}>•</span>
                <span style={{ fontSize: '20px', color: theme.textSecondary, fontWeight: 600 }}>lifeos.app</span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // Square Format (1080x1080)
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '55px',
            background: `linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* REALISTIC GOOGLE MAPS VECTOR OVERLAY */}
          <svg
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.35,
              pointerEvents: 'none',
            }}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
          >
            <path d="M 60 80 C 160 40, 300 180, 220 320 C 140 420, 40 300, 60 80 Z" fill={theme.mapPark} opacity="0.8" />
            <path d="M 650 450 C 800 390, 950 520, 880 720 C 750 850, 620 750, 650 450 Z" fill={theme.mapPark} opacity="0.7" />

            <path d="M -50 650 C 250 600, 450 800, 750 700 S 1050 850, 1150 800 L 1150 950 L -50 950 Z" fill={theme.mapWater} opacity="0.85" />

            <g stroke={theme.mapRoadSub} strokeWidth="5" opacity="0.7">
              <line x1="0" y1="200" x2="1080" y2="200" />
              <line x1="0" y1="420" x2="1080" y2="420" />
              <line x1="0" y1="650" x2="1080" y2="650" />
              <line x1="0" y1="880" x2="1080" y2="880" />

              <line x1="200" y1="0" x2="200" y2="1080" />
              <line x1="450" y1="0" x2="450" y2="1080" />
              <line x1="700" y1="0" x2="700" y2="1080" />
              <line x1="900" y1="0" x2="900" y2="1080" />
            </g>

            <g stroke={theme.mapRoadMain} strokeWidth="14" strokeLinecap="round" opacity="0.9">
              <path d="M -50 300 Q 350 150 650 420 T 1150 680" />
              <path d="M 280 -50 Q 420 400 250 800 T 820 1150" />
            </g>

            <path d="M -50 300 Q 350 150 650 420 T 1150 680" stroke="#FFC107" strokeWidth="4" opacity="0.8" />

            <path
              d="M 140 280 Q 280 140 480 220 T 780 160 T 940 340 T 680 580 T 400 520 T 220 780 T 640 920 T 920 820"
              stroke={theme.primary}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />

            <circle cx="140" cy="280" r="14" fill={theme.primary} />
            <circle cx="140" cy="280" r="24" fill="none" stroke={theme.primary} strokeWidth="3" opacity="0.6" />

            <circle cx="920" cy="820" r="14" fill="#FF5252" />
            <circle cx="920" cy="820" r="28" fill="none" stroke="#FF5252" strokeWidth="3.5" opacity="0.7" />
          </svg>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '24px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
              <span style={{ fontSize: '18px' }}>📍</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>GOOGLE MAPS NIGHT</span>
            </div>
            <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 700 }}>{cardData.date}</span>
          </div>

          {/* Hero Section: Focus Score + User Name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 36px', borderRadius: '28px', background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '34px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '-1px' }}>{cardData.userName}</span>
              <span style={{ fontSize: '18px', color: theme.textSecondary, fontWeight: 600 }}>{getMoodEmoji(cardData.mood)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: theme.textMuted, letterSpacing: '2px', textTransform: 'uppercase' }}>FOCUS SCORE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '68px', fontWeight: 900, color: theme.primary, lineHeight: 1 }}>{focusPercent}</span>
                <span style={{ fontSize: '32px', fontWeight: 800, color: theme.primary }}>%</span>
              </div>
            </div>
          </div>

          {/* Finished Habits & Tasks Name List */}
          <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 2 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '22px 24px', borderRadius: '22px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: theme.textPrimary }}>🎯 Habits ({cardData.habitsCompleted}/{cardData.habitsTotal})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {habitList.slice(0, 3).map((name: string, i: number) => (
                  <span key={i} style={{ fontSize: '14px', color: theme.textSecondary, background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                    ✓ {name}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '22px 24px', borderRadius: '22px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '20px', fontWeight: 900, color: theme.textPrimary }}>✅ Tasks ({cardData.tasksCompleted}/{cardData.tasksTotal})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {taskList.slice(0, 2).map((title: string, i: number) => (
                  <span key={i} style={{ fontSize: '14px', color: theme.textSecondary, background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '8px', fontWeight: 700 }}>
                    ✓ {title}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Streak Banner */}
          {cardData.topStreak ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderRadius: '20px', background: `linear-gradient(90deg, ${theme.primary}20, ${theme.secondary}12)`, border: `1px solid ${theme.primary}35`, position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🔥</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: theme.textPrimary }}>{cardData.topStreak.name}</span>
              </div>
              <span style={{ fontSize: '24px', fontWeight: 900, color: theme.primary }}>{cardData.topStreak.streak} DAYS STREAK</span>
            </div>
          ) : cardData.achievements && cardData.achievements.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative', zIndex: 2 }}>
              {cardData.achievements.slice(0, 3).map((badge: string, i: number) => (
                <div key={i} style={{ display: 'flex', padding: '8px 14px', borderRadius: '12px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '16px', color: theme.badgeText, fontWeight: 800 }}>
                  {badge}
                </div>
              ))}
            </div>
          ) : null}

          {/* Branding Watermark */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span style={{ fontSize: '16px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
              <span style={{ fontSize: '16px', color: theme.textMuted }}>•</span>
              <span style={{ fontSize: '16px', color: theme.textSecondary, fontWeight: 600 }}>lifeos.app</span>
            </div>
          </div>
        </div>
      ),
      { width, height }
    );
  } catch (error: any) {
    console.error('Error generating OG card:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}
