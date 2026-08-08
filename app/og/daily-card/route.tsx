import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Strava & Spotify Wrapped Inspired Color Palettes
const THEMES: Record<string, {
  name: string;
  bg1: string; bg2: string; bg3: string;
  primary: string; secondary: string; glow: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  cardBg: string; cardBorder: string; badgeBg: string; badgeText: string;
}> = {
  strava: {
    name: 'Strava Kinetic',
    bg1: '#0d0705', bg2: '#1f0d07', bg3: '#080504',
    primary: '#FC4C02', secondary: '#FF8800', glow: '#FF3D00',
    textPrimary: '#FFFFFF', textSecondary: '#FFCCBC', textMuted: '#8C6658',
    cardBg: 'rgba(252, 76, 2, 0.08)', cardBorder: 'rgba(252, 76, 2, 0.25)',
    badgeBg: 'rgba(252, 76, 2, 0.2)', badgeText: '#FF7A45',
  },
  cyber: {
    name: 'Cyber Mint',
    bg1: '#03140e', bg2: '#082b1d', bg3: '#020d09',
    primary: '#00E676', secondary: '#00B0FF', glow: '#00E676',
    textPrimary: '#FFFFFF', textSecondary: '#B9F6CA', textMuted: '#4E8A6E',
    cardBg: 'rgba(0, 230, 118, 0.08)', cardBorder: 'rgba(0, 230, 118, 0.25)',
    badgeBg: 'rgba(0, 230, 118, 0.2)', badgeText: '#69F0AE',
  },
  purple: {
    name: 'Neon Violet',
    bg1: '#0f051d', bg2: '#1f0a3b', bg3: '#090312',
    primary: '#C084FC', secondary: '#F472B6', glow: '#A855F7',
    textPrimary: '#FFFFFF', textSecondary: '#E9D5FF', textMuted: '#7E5B9B',
    cardBg: 'rgba(168, 85, 247, 0.08)', cardBorder: 'rgba(168, 85, 247, 0.25)',
    badgeBg: 'rgba(168, 85, 247, 0.2)', badgeText: '#D8B4FE',
  },
  ocean: {
    name: 'Sapphire Cyan',
    bg1: '#04101e', bg2: '#08213d', bg3: '#020a14',
    primary: '#38BDF8', secondary: '#34D399', glow: '#0EA5E9',
    textPrimary: '#FFFFFF', textSecondary: '#BAE6FD', textMuted: '#4B7A94',
    cardBg: 'rgba(14, 165, 233, 0.08)', cardBorder: 'rgba(14, 165, 233, 0.25)',
    badgeBg: 'rgba(14, 165, 233, 0.2)', badgeText: '#7DD3FC',
  },
  dark: {
    name: 'Obsidian Lime',
    bg1: '#09090b', bg2: '#18181b', bg3: '#000000',
    primary: '#A3E635', secondary: '#38BDF8', glow: '#84CC16',
    textPrimary: '#FFFFFF', textSecondary: '#D9F99D', textMuted: '#71717A',
    cardBg: 'rgba(255, 255, 255, 0.05)', cardBorder: 'rgba(255, 255, 255, 0.15)',
    badgeBg: 'rgba(163, 230, 53, 0.18)', badgeText: '#BEF264',
  },
};

function getMoodEmoji(mood: number | null): string {
  if (!mood) return '🔥';
  if (mood >= 5) return '⚡ Super Charged';
  if (mood >= 4) return '🎯 High Focus';
  if (mood >= 3) return '⚡ Balanced';
  if (mood >= 2) return '🌧️ Recovering';
  return '💤 Resting';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'square';
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
              padding: '90px 70px',
              background: `linear-gradient(165deg, ${theme.bg1} 0%, ${theme.bg2} 55%, ${theme.bg3} 100%)`,
              fontFamily: 'Inter, system-ui, sans-serif',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Strava Background Radial Orbs */}
            <div style={{ position: 'absolute', top: '-150px', right: '-150px', width: '700px', height: '700px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}25, transparent 65%)`, display: 'flex' }} />
            <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.secondary}18, transparent 65%)`, display: 'flex' }} />

            {/* Strava Vector Topo Map & Polyline Route Overlay */}
            <svg
              width={width}
              height={height}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                opacity: 0.22,
                pointerEvents: 'none',
              }}
              viewBox={`0 0 ${width} ${height}`}
              fill="none"
            >
              {/* Topography Contour Lines */}
              <path d="M -100 200 C 200 100, 400 400, 700 200 S 1000 300, 1200 150" stroke={theme.primary} strokeWidth="2.5" />
              <path d="M -100 350 C 250 200, 500 500, 800 300 S 1100 450, 1200 280" stroke={theme.primary} strokeWidth="2.5" />
              <path d="M -100 500 C 300 350, 550 650, 850 420 S 1150 550, 1200 400" stroke={theme.primary} strokeWidth="2" />
              <path d="M -100 650 C 200 500, 600 800, 900 550 S 1100 700, 1200 580" stroke={theme.primary} strokeWidth="2" />
              <path d="M -100 800 C 350 650, 650 950, 950 700 S 1150 850, 1200 720" stroke={theme.primary} strokeWidth="1.5" />
              <path d="M -100 1050 C 250 900, 550 1200, 850 1000 S 1150 1150, 1200 1020" stroke={theme.primary} strokeWidth="1.5" />
              <path d="M -100 1300 C 300 1150, 600 1450, 900 1250 S 1150 1400, 1200 1280" stroke={theme.primary} strokeWidth="1.5" />

              {/* Grid Lines */}
              <path d="M 0 300 L 1080 300 M 0 600 L 1080 600 M 0 900 L 1080 900 M 0 1200 L 1080 1200 M 0 1500 L 1080 1500" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />
              <path d="M 270 0 L 270 1920 M 540 0 L 540 1920 M 810 0 L 810 1920" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />

              {/* Strava Kinetic GPS Activity Route Path */}
              <path
                d="M 180 400 Q 280 200 480 300 T 780 200 T 920 450 T 680 700 T 420 600 T 240 850 T 650 1100 T 880 1350 T 520 1650"
                stroke={theme.primary}
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />

              {/* GPS Nodes */}
              <circle cx="180" cy="400" r="14" fill={theme.primary} />
              <circle cx="180" cy="400" r="24" fill="none" stroke={theme.primary} strokeWidth="3" opacity="0.6" />

              <circle cx="520" cy="1650" r="14" fill={theme.secondary} />
              <circle cx="520" cy="1650" r="24" fill="none" stroke={theme.secondary} strokeWidth="3" opacity="0.6" />
            </svg>

            {/* Header / Brand Pill & Location Tag */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 24px', borderRadius: '30px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: theme.primary }} />
                  <span style={{ fontSize: '20px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>LIFE OS MAPS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '18px' }}>📍</span>
                  <span style={{ fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>PRODUCTIVITY ZONE</span>
                </div>
              </div>

              {/* User Greeting */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '56px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '-1.5px', lineHeight: 1.1 }}>
                  {cardData.userName}&rsquo;s Daily Flex
                </span>
                <span style={{ fontSize: '26px', color: theme.textSecondary, fontWeight: 500 }}>
                  {getMoodEmoji(cardData.mood)} • {cardData.date}
                </span>
              </div>
            </div>

            {/* Hero Metric: Focus Score Dial */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '50px',
                borderRadius: '36px',
                background: theme.cardBg,
                border: `1.5px solid ${theme.cardBorder}`,
                boxShadow: `0 30px 60px ${theme.glow}15`,
                position: 'relative',
                zIndex: 2,
                gap: '12px',
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textMuted, letterSpacing: '4px', textTransform: 'uppercase' }}>
                DAILY FOCUS SCORE
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '130px', fontWeight: 900, color: theme.primary, lineHeight: 1, letterSpacing: '-4px' }}>
                  {focusPercent}
                </span>
                <span style={{ fontSize: '60px', fontWeight: 800, color: theme.primary }}>%</span>
              </div>

              {/* Segmented Progress Indicator */}
              <div style={{ display: 'flex', width: '100%', height: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: '10px' }}>
                <div style={{ width: `${focusPercent}%`, height: '100%', borderRadius: '8px', background: `linear-gradient(90deg, ${theme.primary}, ${theme.secondary})` }} />
              </div>
            </div>

            {/* Dual Stats Grid */}
            <div style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 2 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 30px', borderRadius: '30px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '32px' }}>🎯</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.primary, background: theme.badgeBg, padding: '4px 14px', borderRadius: '12px' }}>
                    {cardData.habitsTotal > 0 ? Math.round((cardData.habitsCompleted / cardData.habitsTotal) * 100) : 0}%
                  </span>
                </div>
                <span style={{ fontSize: '54px', fontWeight: 900, color: theme.textPrimary, lineHeight: 1 }}>
                  {cardData.habitsCompleted}/{cardData.habitsTotal}
                </span>
                <span style={{ fontSize: '22px', color: theme.textSecondary, fontWeight: 700 }}>Habits Finished</span>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '36px 30px', borderRadius: '30px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '32px' }}>✅</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: theme.secondary, background: 'rgba(255,255,255,0.08)', padding: '4px 14px', borderRadius: '12px' }}>
                    {cardData.tasksTotal > 0 ? Math.round((cardData.tasksCompleted / cardData.tasksTotal) * 100) : 0}%
                  </span>
                </div>
                <span style={{ fontSize: '54px', fontWeight: 900, color: theme.textPrimary, lineHeight: 1 }}>
                  {cardData.tasksCompleted}/{cardData.tasksTotal}
                </span>
                <span style={{ fontSize: '22px', color: theme.textSecondary, fontWeight: 700 }}>Tasks Done</span>
              </div>
            </div>

            {/* Streak Flex Banner */}
            {cardData.topStreak && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 36px', borderRadius: '26px', background: `linear-gradient(90deg, ${theme.primary}25, ${theme.secondary}15)`, border: `1px solid ${theme.primary}40`, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '40px' }}>🔥</span>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '28px', fontWeight: 900, color: theme.textPrimary }}>{cardData.topStreak.name}</span>
                    <span style={{ fontSize: '20px', color: theme.textSecondary }}>Active Habit Streak</span>
                  </div>
                </div>
                <span style={{ fontSize: '44px', fontWeight: 900, color: theme.primary }}>{cardData.topStreak.streak} DAYS</span>
              </div>
            )}

            {/* Achievements Badges */}
            {cardData.achievements && cardData.achievements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', position: 'relative', zIndex: 2 }}>
                {cardData.achievements.map((badge: string, i: number) => (
                  <div key={i} style={{ display: 'flex', padding: '14px 24px', borderRadius: '20px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '22px', color: theme.badgeText, fontWeight: 800 }}>
                    {badge}
                  </div>
                ))}
              </div>
            )}

            {/* Quote / Highlight */}
            {cardData.highlights && cardData.highlights.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '30px', borderRadius: '26px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 800, letterSpacing: '3px', textTransform: 'uppercase' }}>TODAY&rsquo;S HIGHLIGHT</span>
                <span style={{ fontSize: '26px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{cardData.highlights[0]}&rdquo;</span>
              </div>
            ) : cardData.quote ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', padding: '24px', borderRadius: '20px', background: theme.cardBg, position: 'relative', zIndex: 2 }}>
                <span style={{ fontSize: '22px', color: theme.textSecondary, fontStyle: 'italic', textAlign: 'center', fontWeight: 500 }}>&ldquo;{cardData.quote}&rdquo;</span>
              </div>
            ) : null}

            {/* Footer / Watermark */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 32px', borderRadius: '30px', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.15)' }}>
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
            padding: '60px',
            background: `linear-gradient(140deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glowing Circles */}
          <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}25, transparent 65%)`, display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: '-120px', left: '-120px', width: '450px', height: '450px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.secondary}18, transparent 65%)`, display: 'flex' }} />

          {/* Strava Topo Map & Polyline Route Overlay */}
          <svg
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.22,
              pointerEvents: 'none',
            }}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
          >
            {/* Topography Contour Lines */}
            <path d="M -50 150 C 200 80, 400 300, 700 150 S 1000 250, 1150 120" stroke={theme.primary} strokeWidth="2.5" />
            <path d="M -50 300 C 250 150, 500 400, 800 250 S 1100 350, 1150 220" stroke={theme.primary} strokeWidth="2" />
            <path d="M -50 450 C 300 300, 550 550, 850 350 S 1150 480, 1150 350" stroke={theme.primary} strokeWidth="2" />
            <path d="M -50 600 C 200 450, 600 700, 900 480 S 1100 620, 1150 500" stroke={theme.primary} strokeWidth="1.5" />
            <path d="M -50 750 C 350 600, 650 850, 950 620 S 1150 780, 1150 650" stroke={theme.primary} strokeWidth="1.5" />

            {/* Grid */}
            <path d="M 0 270 L 1080 270 M 0 540 L 1080 540 M 0 810 L 1080 810" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />
            <path d="M 270 0 L 270 1080 M 540 0 L 540 1080 M 810 0 L 810 1080" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />

            {/* Strava Polyline Activity Route */}
            <path
              d="M 120 280 Q 240 140 420 220 T 720 150 T 950 320 T 680 550 T 400 480 T 220 720 T 620 880 T 920 750"
              stroke={theme.primary}
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* GPS Start & Finish Nodes */}
            <circle cx="120" cy="280" r="14" fill={theme.primary} />
            <circle cx="120" cy="280" r="24" fill="none" stroke={theme.primary} strokeWidth="3" opacity="0.6" />

            <circle cx="920" cy="750" r="14" fill={theme.secondary} />
            <circle cx="920" cy="750" r="24" fill="none" stroke={theme.secondary} strokeWidth="3" opacity="0.6" />
          </svg>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 20px', borderRadius: '24px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}` }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.primary }} />
              <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '3px', textTransform: 'uppercase' }}>LIFE OS MAPS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '16px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span style={{ fontSize: '15px' }}>📍</span>
              <span style={{ fontSize: '15px', color: theme.textSecondary, fontWeight: 700 }}>PRODUCTIVITY ROUTE</span>
            </div>
          </div>

          {/* Hero Section: Focus Score + User Name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '36px 40px', borderRadius: '30px', background: theme.cardBg, border: `1.5px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '38px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '-1px' }}>{cardData.userName}</span>
              <span style={{ fontSize: '20px', color: theme.textSecondary, fontWeight: 600 }}>{getMoodEmoji(cardData.mood)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: theme.textMuted, letterSpacing: '2px', textTransform: 'uppercase' }}>FOCUS SCORE</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontSize: '72px', fontWeight: 900, color: theme.primary, lineHeight: 1 }}>{focusPercent}</span>
                <span style={{ fontSize: '36px', fontWeight: 800, color: theme.primary }}>%</span>
              </div>
            </div>
          </div>

          {/* Stats Cards Row */}
          <div style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 2 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 24px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>🎯</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.primary, background: theme.badgeBg, padding: '3px 10px', borderRadius: '10px' }}>
                  {cardData.habitsTotal > 0 ? Math.round((cardData.habitsCompleted / cardData.habitsTotal) * 100) : 0}%
                </span>
              </div>
              <span style={{ fontSize: '42px', fontWeight: 900, color: theme.textPrimary, lineHeight: 1 }}>
                {cardData.habitsCompleted}/{cardData.habitsTotal}
              </span>
              <span style={{ fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>Habits Completed</span>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '28px 24px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '24px' }}>✅</span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: theme.secondary, background: 'rgba(255,255,255,0.08)', padding: '3px 10px', borderRadius: '10px' }}>
                  {cardData.tasksTotal > 0 ? Math.round((cardData.tasksCompleted / cardData.tasksTotal) * 100) : 0}%
                </span>
              </div>
              <span style={{ fontSize: '42px', fontWeight: 900, color: theme.textPrimary, lineHeight: 1 }}>
                {cardData.tasksCompleted}/{cardData.tasksTotal}
              </span>
              <span style={{ fontSize: '18px', color: theme.textSecondary, fontWeight: 700 }}>Tasks Finished</span>
            </div>
          </div>

          {/* Streak Banner */}
          {cardData.topStreak ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px', borderRadius: '20px', background: `linear-gradient(90deg, ${theme.primary}20, ${theme.secondary}12)`, border: `1px solid ${theme.primary}35`, position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>🔥</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: theme.textPrimary }}>{cardData.topStreak.name}</span>
              </div>
              <span style={{ fontSize: '28px', fontWeight: 900, color: theme.primary }}>{cardData.topStreak.streak} DAYS STREAK</span>
            </div>
          ) : cardData.achievements && cardData.achievements.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', position: 'relative', zIndex: 2 }}>
              {cardData.achievements.slice(0, 3).map((badge: string, i: number) => (
                <div key={i} style={{ display: 'flex', padding: '10px 18px', borderRadius: '14px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, fontSize: '18px', color: theme.badgeText, fontWeight: 800 }}>
                  {badge}
                </div>
              ))}
            </div>
          ) : null}

          {/* Quote / Highlight */}
          {cardData.highlights && cardData.highlights.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '20px 24px', borderRadius: '20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
              <span style={{ fontSize: '13px', color: theme.textMuted, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>HIGHLIGHT</span>
              <span style={{ fontSize: '20px', color: theme.textPrimary, fontStyle: 'italic', fontWeight: 600 }}>&ldquo;{cardData.highlights[0]}&rdquo;</span>
            </div>
          ) : null}

          {/* Branding Watermark */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)' }}>
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
